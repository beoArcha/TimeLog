use crate::engine::{Engine, EngineError};
use crate::types::{
    CurrencyBillingSummary, EffectiveRateResult, ElapsedRangeFilter, Project, RangeBillingResult,
    RateStatus, Task, TaskBillingSummary,
};
use std::collections::HashMap;

pub fn validate_currency_code(s: &str) -> Result<String, EngineError> {
    let trimmed = s.trim();
    if trimmed.len() != 3 || !trimmed.chars().all(|c| c.is_ascii_alphabetic()) {
        return Err(EngineError::Validation(format!(
            "Invalid currency code '{}'. Must be a 3-letter ISO code.",
            s
        )));
    }
    Ok(trimmed.to_ascii_uppercase())
}

pub const MAX_BILLING_RATE_CENTS: u64 = 9_007_199_254_740_991;

pub fn validate_billing_rate_cents(cents: u64) -> Result<u64, EngineError> {
    if cents > MAX_BILLING_RATE_CENTS {
        return Err(EngineError::Validation(format!(
            "Billing rate exceeds the supported maximum of {} cents",
            MAX_BILLING_RATE_CENTS
        )));
    }
    Ok(cents)
}

pub fn checked_billing_rate_to_i64(cents: u64) -> Result<i64, EngineError> {
    i64::try_from(validate_billing_rate_cents(cents)?).map_err(|_| {
        EngineError::Validation("Billing rate exceeds the supported storage range".to_string())
    })
}

pub fn validate_stored_billing_rate_cents(cents: i64) -> Result<u64, EngineError> {
    let cents = u64::try_from(cents).map_err(|_| {
        EngineError::Validation("Stored billing rate cannot be negative".to_string())
    })?;
    validate_billing_rate_cents(cents)
}

pub fn validate_and_parse_rate(s: &str) -> Result<u64, EngineError> {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return Err(EngineError::Validation(
            "Hourly rate cannot be empty".to_string(),
        ));
    }
    let cents = if let Some((whole_str, frac_str)) = trimmed.split_once('.') {
        if whole_str.is_empty() || !whole_str.chars().all(|c| c.is_ascii_digit()) {
            return Err(EngineError::Validation(format!(
                "Invalid rate format: '{}'",
                s
            )));
        }
        let whole = whole_str.parse::<u64>().map_err(|_| {
            EngineError::Validation(format!(
                "Invalid whole rate component: '{}'",
                whole_str
            ))
        })?;
        if frac_str.len() > 2 || !frac_str.chars().all(|c| c.is_ascii_digit()) {
            return Err(EngineError::Validation(format!(
                "Rate fraction can have at most 2 decimal places: '{}'",
                s
            )));
        }
        let frac = match frac_str.len() {
            0 => 0,
            1 => frac_str.parse::<u64>().unwrap() * 10,
            _ => frac_str.parse::<u64>().unwrap(),
        };
        whole
            .checked_mul(100)
            .and_then(|w| w.checked_add(frac))
            .ok_or_else(|| {
                EngineError::Validation(format!(
                    "Rate value '{}' exceeds supported range",
                    s
                ))
            })?
    } else {
        if !trimmed.chars().all(|c| c.is_ascii_digit()) {
            return Err(EngineError::Validation(format!("Invalid rate: '{}'", s)));
        }
        trimmed
            .parse::<u64>()
            .map_err(|_| EngineError::Validation(format!("Invalid rate: '{}'", s)))?
            .checked_mul(100)
            .ok_or_else(|| {
                EngineError::Validation(format!(
                    "Rate value '{}' exceeds supported range",
                    s
                ))
            })?
    };
    validate_billing_rate_cents(cents)
}

pub fn parse_rate_to_cents(s: &str) -> Option<u64> {
    validate_and_parse_rate(s).ok()
}

pub fn parse_rate_or_cents(s: &str) -> Option<u64> {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return None;
    }
    let cents = if let Some(value) = trimmed
        .strip_suffix('c')
        .or_else(|| trimmed.strip_suffix('¢'))
    {
        let value = value.trim();
        if value.is_empty() || !value.chars().all(|c| c.is_ascii_digit()) {
            return None;
        }
        value.parse::<u64>().ok()?
    } else if trimmed.contains('.') {
        return parse_rate_to_cents(trimmed);
    } else {
        if !trimmed.chars().all(|c| c.is_ascii_digit()) {
            return None;
        }
        trimmed.parse::<u64>().ok()?.checked_mul(100)?
    };
    validate_billing_rate_cents(cents).ok()
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

pub fn normalize_currency(raw: Option<&str>) -> Option<String> {
    raw.map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_ascii_uppercase())
}

pub fn resolve_effective_currency(task: &Task, project: Option<&Project>) -> Option<String> {
    normalize_currency(task.billing_currency.as_deref())
        .or_else(|| normalize_currency(task.currency.as_deref()))
        .or_else(|| project.and_then(|p| normalize_currency(p.billing_currency.as_deref())))
        .or_else(|| project.and_then(|p| normalize_currency(p.currency.as_deref())))
}

pub fn resolve_effective_rate(
    task: &Task,
    project: Option<&Project>,
    default_rate_cents: Option<u64>,
) -> EffectiveRateResult {
    // Currency resolution order: Task billing_currency/currency -> Project billing_currency/currency
    let currency = resolve_effective_currency(task, project);

    // Level 1: Task override
    let task_cents = if let Some(cents) = task.billing_rate_cents {
        u64::try_from(cents).ok().filter(|v| *v <= MAX_BILLING_RATE_CENTS)
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
            return EffectiveRateResult {
                rate: Some("0.00".to_string()),
                currency,
                status: RateStatus::NonBillable,
                source: "task".to_string(),
            };
        }
        return EffectiveRateResult {
            rate: Some(format_cents(cents)),
            currency,
            status: RateStatus::Custom,
            source: "task".to_string(),
        };
    }

    // Level 2: Project rate inheritance
    let proj_cents = if let Some(proj) = project {
        if let Some(cents) = proj.billing_rate_cents {
            u64::try_from(cents).ok().filter(|v| *v <= MAX_BILLING_RATE_CENTS)
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
            return EffectiveRateResult {
                rate: Some("0.00".to_string()),
                currency,
                status: RateStatus::NonBillable,
                source: "project".to_string(),
            };
        }
        return EffectiveRateResult {
            rate: Some(format_cents(cents)),
            currency,
            status: RateStatus::Inherited,
            source: "project".to_string(),
        };
    }

    // Level 3: Default system / runtime configuration rate
    if let Some(cents) = default_rate_cents {
        if cents == 0 {
            return EffectiveRateResult {
                rate: Some("0.00".to_string()),
                currency,
                status: RateStatus::NonBillable,
                source: "default".to_string(),
            };
        }
        return EffectiveRateResult {
            rate: Some(format_cents(cents)),
            currency,
            status: RateStatus::Inherited,
            source: "default".to_string(),
        };
    }

    // Level 4: Unconfigured fallback
    EffectiveRateResult {
        rate: None,
        currency,
        status: RateStatus::Unconfigured,
        source: "none".to_string(),
    }
}

pub fn calculate_range_billing_from_snapshot(
    task_elapsed: &HashMap<String, u64>,
    tasks: &[Task],
    projects: &[Project],
    default_rate_cents: Option<u64>,
) -> RangeBillingResult {
    let task_map: HashMap<&str, &Task> = tasks.iter().map(|t| (t.id.as_str(), t)).collect();
    let project_map: HashMap<&str, &Project> =
        projects.iter().map(|p| (p.id.as_str(), p)).collect();

    let mut by_task = Vec::new();
    let mut currency_cents: HashMap<String, u64> = HashMap::new();
    let mut currency_billable_secs: HashMap<String, u64> = HashMap::new();
    let mut currency_non_billable_secs: HashMap<String, u64> = HashMap::new();
    let mut currency_unconfigured_secs: HashMap<String, u64> = HashMap::new();

    let mut total_billable_seconds: u64 = 0;
    let mut total_non_billable_seconds: u64 = 0;
    let mut total_unconfigured_seconds: u64 = 0;

    let mut sorted_entries: Vec<(&String, &u64)> = task_elapsed.iter().collect();
    sorted_entries.sort_by_key(|(tid, _)| (*tid).clone());

    for (task_id, &duration_seconds) in sorted_entries {
        if duration_seconds == 0 {
            continue;
        }

        let task = match task_map.get(task_id.as_str()) {
            Some(t) => t,
            None => continue,
        };

        let project = project_map.get(task.project_id.as_str()).copied();
        let effective = resolve_effective_rate(task, project, default_rate_cents);
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
                *currency_billable_secs.entry(curr_key.clone()).or_insert(0) += duration_seconds;
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

    let mut all_curr_keys: std::collections::BTreeSet<String> = std::collections::BTreeSet::new();
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
                non_billable_duration_seconds: *currency_non_billable_secs.get(&curr).unwrap_or(&0),
                unconfigured_duration_seconds: *currency_unconfigured_secs.get(&curr).unwrap_or(&0),
            },
        );
    }

    RangeBillingResult {
        by_currency,
        by_task,
        total_billable_seconds,
        total_non_billable_seconds,
        total_unconfigured_seconds,
    }
}

impl<'a> Engine<'a> {
    fn get_default_rate_cents(&self) -> Option<u64> {
        let Ok(configs) = self.persistence.settings.get_runtime_configs() else {
            return None;
        };
        let cfg = configs.iter().find(|c| {
            c.id == "default_billing_rate"
                || c.id == "default_rate"
                || c.runtime == "billing_default"
        })?;
        parse_rate_to_cents(&cfg.config)
    }

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
        let default_rate_cents = self.get_default_rate_cents();

        Ok(resolve_effective_rate(
            &task,
            project.as_ref(),
            default_rate_cents,
        ))
    }

    pub fn calculate_range_billing(
        &self,
        filter: &ElapsedRangeFilter,
        now_iso: Option<&str>,
    ) -> Result<RangeBillingResult, EngineError> {
        let metrics = self.calculate_range_metrics(filter, now_iso)?;
        let all_tasks = self.persistence.tasks.get_all()?;
        let all_projects = self.persistence.projects.get_all()?;
        let default_rate_cents = self.get_default_rate_cents();

        Ok(calculate_range_billing_from_snapshot(
            &metrics.task_elapsed,
            &all_tasks,
            &all_projects,
            default_rate_cents,
        ))
    }
}
