use crate::engine::{Engine, EngineError};
use crate::types::{
    CurrencyBillingSummary, EffectiveRateResult, ElapsedRangeFilter, RangeBillingResult,
    RateStatus, TaskBillingSummary,
};
use std::collections::HashMap;

pub fn parse_rate_to_cents(s: &str) -> Option<u64> {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return None;
    }
    if let Some((whole_str, frac_str)) = trimmed.split_once('.') {
        let whole: u64 = whole_str.parse().ok()?;
        let frac_padded = match frac_str.len() {
            0 => 0,
            1 => frac_str.parse::<u64>().ok()? * 10,
            _ => frac_str[..2].parse::<u64>().ok()?,
        };
        Some(whole * 100 + frac_padded)
    } else {
        let whole: u64 = trimmed.parse().ok()?;
        Some(whole * 100)
    }
}

pub fn parse_rate_or_cents(s: &str) -> Option<u64> {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return None;
    }
    if trimmed.contains('.') {
        parse_rate_to_cents(trimmed)
    } else if let Ok(val) = trimmed.parse::<u64>() {
        if val >= 1000 {
            Some(val)
        } else {
            Some(val * 100)
        }
    } else {
        None
    }
}

pub fn format_cents(cents: u64) -> String {
    format!("{}.{:02}", cents / 100, cents % 100)
}

pub fn calculate_bankers_amount(duration_seconds: u64, rate_cents: u64) -> u64 {
    let product = (duration_seconds as u128) * (rate_cents as u128);
    let q = product / 3600;
    let r = product % 3600;
    let double_r = r * 2;
    if double_r > 3600 {
        (q + 1) as u64
    } else if double_r < 3600 {
        q as u64
    } else if !q.is_multiple_of(2) {
        (q + 1) as u64
    } else {
        q as u64
    }
}

impl<'a> Engine<'a> {
    pub fn resolve_effective_task_rate(
        &self,
        task_id: &str,
    ) -> Result<EffectiveRateResult, EngineError> {
        let task = self
            .persistence
            .tasks
            .get(task_id)?
            .ok_or_else(|| EngineError::Validation(format!("Task not found: {}", task_id)))?;

        let project = self.persistence.projects.get(&task.project_id)?;

        // Currency resolution order: Task billing_currency/currency -> Project billing_currency/currency
        let currency = task
            .billing_currency
            .clone()
            .or_else(|| task.currency.clone())
            .or_else(|| {
                project
                    .as_ref()
                    .and_then(|p| p.billing_currency.clone().or_else(|| p.currency.clone()))
            });

        // Level 1: Task override
        let task_cents = if let Some(cents) = task.billing_rate_cents {
            Some(cents as u64)
        } else if let Some(task_rate_str) = task.hourly_rate.as_deref() {
            let trimmed = task_rate_str.trim();
            if !trimmed.is_empty() {
                parse_rate_to_cents(trimmed)
            } else {
                None
            }
        } else {
            None
        };

        if let Some(cents) = task_cents {
            if cents == 0 {
                return Ok(EffectiveRateResult {
                    rate: Some("0.00".to_string()),
                    currency,
                    status: RateStatus::NonBillable,
                    source: "task".to_string(),
                });
            }
            return Ok(EffectiveRateResult {
                rate: Some(format_cents(cents)),
                currency,
                status: RateStatus::Custom,
                source: "task".to_string(),
            });
        }

        // Level 2: Project rate inheritance
        let proj_cents = if let Some(proj) = project.as_ref() {
            if let Some(cents) = proj.billing_rate_cents {
                Some(cents as u64)
            } else if let Some(proj_rate_str) = proj.hourly_rate.as_deref() {
                let trimmed = proj_rate_str.trim();
                if !trimmed.is_empty() {
                    parse_rate_to_cents(trimmed)
                } else {
                    None
                }
            } else {
                None
            }
        } else {
            None
        };

        if let Some(cents) = proj_cents {
            if cents == 0 {
                return Ok(EffectiveRateResult {
                    rate: Some("0.00".to_string()),
                    currency,
                    status: RateStatus::NonBillable,
                    source: "project".to_string(),
                });
            }
            return Ok(EffectiveRateResult {
                rate: Some(format_cents(cents)),
                currency,
                status: RateStatus::Inherited,
                source: "project".to_string(),
            });
        }

        // Level 3: Default system / runtime configuration rate
        if let Some(res) = self.resolve_default_rate(currency.clone())? {
            return Ok(res);
        }

        // Level 4: Unconfigured / Unbillable fallback
        Ok(EffectiveRateResult {
            rate: None,
            currency,
            status: RateStatus::Unconfigured,
            source: "none".to_string(),
        })
    }

    fn resolve_default_rate(
        &self,
        currency: Option<String>,
    ) -> Result<Option<EffectiveRateResult>, EngineError> {
        let Ok(configs) = self.persistence.settings.get_runtime_configs() else {
            return Ok(None);
        };
        let Some(cfg) = configs.iter().find(|c| {
            c.id == "default_billing_rate"
                || c.id == "default_rate"
                || c.runtime == "billing_default"
        }) else {
            return Ok(None);
        };
        let Some(cents) = parse_rate_to_cents(&cfg.config) else {
            return Ok(None);
        };
        if cents == 0 {
            return Ok(Some(EffectiveRateResult {
                rate: Some("0.00".to_string()),
                currency,
                status: RateStatus::NonBillable,
                source: "default".to_string(),
            }));
        }
        Ok(Some(EffectiveRateResult {
            rate: Some(format_cents(cents)),
            currency,
            status: RateStatus::Inherited,
            source: "default".to_string(),
        }))
    }

    pub fn calculate_range_billing(
        &self,
        filter: &ElapsedRangeFilter,
        now_iso: Option<&str>,
    ) -> Result<RangeBillingResult, EngineError> {
        let metrics = self.calculate_range_metrics(filter, now_iso)?;
        let all_tasks = self.persistence.tasks.get_all()?;
        let task_map: HashMap<String, _> =
            all_tasks.into_iter().map(|t| (t.id.clone(), t)).collect();

        let all_projects = self.persistence.projects.get_all()?;
        let project_map: HashMap<String, _> = all_projects
            .into_iter()
            .map(|p| (p.id.clone(), p))
            .collect();

        let mut by_task = Vec::new();
        let mut currency_cents: HashMap<String, u64> = HashMap::new();
        let mut currency_billable_secs: HashMap<String, u64> = HashMap::new();
        let mut currency_non_billable_secs: HashMap<String, u64> = HashMap::new();
        let mut currency_unconfigured_secs: HashMap<String, u64> = HashMap::new();

        let mut total_billable_seconds: u64 = 0;
        let mut total_non_billable_seconds: u64 = 0;
        let mut total_unconfigured_seconds: u64 = 0;

        let mut sorted_entries: Vec<(&String, &u64)> = metrics.task_elapsed.iter().collect();
        sorted_entries.sort_by_key(|(tid, _)| (*tid).clone());

        for (task_id, &duration_seconds) in sorted_entries {
            if duration_seconds == 0 {
                continue;
            }

            let task = match task_map.get(task_id) {
                Some(t) => t,
                None => continue,
            };

            let _project = project_map.get(&task.project_id);
            let effective = self.resolve_effective_task_rate(task_id)?;
            let currency = effective.currency.clone();
            let curr_key = currency.clone().unwrap_or_else(|| "UNKNOWN".to_string());

            let amount_str = match effective.status {
                RateStatus::NonBillable => {
                    total_non_billable_seconds += duration_seconds;
                    *currency_non_billable_secs
                        .entry(curr_key.clone())
                        .or_insert(0) += duration_seconds;
                    Some("0.00".to_string())
                }
                RateStatus::Unconfigured => {
                    total_unconfigured_seconds += duration_seconds;
                    *currency_unconfigured_secs
                        .entry(curr_key.clone())
                        .or_insert(0) += duration_seconds;
                    None
                }
                RateStatus::Custom | RateStatus::Inherited => {
                    total_billable_seconds += duration_seconds;
                    *currency_billable_secs.entry(curr_key.clone()).or_insert(0) +=
                        duration_seconds;
                    let cents = effective
                        .rate
                        .as_deref()
                        .and_then(parse_rate_to_cents)
                        .unwrap_or(0);
                    let amt_cents = calculate_bankers_amount(duration_seconds, cents);
                    *currency_cents.entry(curr_key.clone()).or_insert(0) += amt_cents;
                    Some(format_cents(amt_cents))
                }
            };

            by_task.push(TaskBillingSummary {
                task_id: task_id.clone(),
                task_name: task.name.clone(),
                project_id: task.project_id.clone(),
                duration_seconds,
                effective_rate: effective.rate,
                currency,
                rate_status: effective.status,
                amount: amount_str,
            });
        }

        // Build by_currency
        let mut all_curr_keys: std::collections::BTreeSet<String> =
            std::collections::BTreeSet::new();
        all_curr_keys.extend(currency_cents.keys().cloned());
        all_curr_keys.extend(currency_billable_secs.keys().cloned());
        all_curr_keys.extend(currency_non_billable_secs.keys().cloned());
        all_curr_keys.extend(currency_unconfigured_secs.keys().cloned());

        let mut by_currency = HashMap::new();
        for curr in all_curr_keys {
            let total_cents = *currency_cents.get(&curr).unwrap_or(&0);
            by_currency.insert(
                curr.clone(),
                CurrencyBillingSummary {
                    currency: curr.clone(),
                    total_amount: format_cents(total_cents),
                    billable_duration_seconds: *currency_billable_secs.get(&curr).unwrap_or(&0),
                    non_billable_duration_seconds: *currency_non_billable_secs
                        .get(&curr)
                        .unwrap_or(&0),
                    unconfigured_duration_seconds: *currency_unconfigured_secs
                        .get(&curr)
                        .unwrap_or(&0),
                },
            );
        }

        Ok(RangeBillingResult {
            by_currency,
            by_task,
            total_billable_seconds,
            total_non_billable_seconds,
            total_unconfigured_seconds,
        })
    }
}
