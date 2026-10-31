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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::persistence::{Persistence, PersistenceConfig};
    use crate::types::{NewTimeLog, Project, RuntimeConfig, Task};

    fn setup_test_persistence() -> (Persistence, std::path::PathBuf) {
        let db_path = std::env::temp_dir().join(format!(
            "test_billing_unit_{}.db",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let csv_dir = std::env::temp_dir().join(format!(
            "test_billing_csv_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let config = PersistenceConfig {
            db_path: db_path.clone(),
            csv_directory: csv_dir,
        };
        let persistence = Persistence::new(&config).expect("persistence initialization");
        (persistence, db_path)
    }

    #[test]
    fn test_parse_rate() {
        assert_eq!(parse_rate_to_cents("150"), Some(15000));
        assert_eq!(parse_rate_to_cents("150.00"), Some(15000));
        assert_eq!(parse_rate_to_cents("150.5"), Some(15050));
        assert_eq!(parse_rate_to_cents("150.55"), Some(15055));
        assert_eq!(parse_rate_to_cents("0"), Some(0));
        assert_eq!(parse_rate_to_cents("0.00"), Some(0));
        assert_eq!(parse_rate_to_cents(""), None);
        assert_eq!(parse_rate_to_cents("-10"), None);

        assert_eq!(parse_rate_or_cents("15000"), Some(15000));
        assert_eq!(parse_rate_or_cents("150.00"), Some(15000));
        assert_eq!(parse_rate_or_cents("150"), Some(15000));
    }

    #[test]
    fn test_rounding_parity() {
        // 1 hour at 150.00 -> 150.00
        let c = calculate_bankers_amount(3600, 15000);
        assert_eq!(format_cents(c), "150.00");

        // 0.5 hour at 150.00 -> 75.00
        let c = calculate_bankers_amount(1800, 15000);
        assert_eq!(format_cents(c), "75.00");

        // 50s at 0.36 -> 1800/3600 = 0.5 -> round to even (0) -> 0.00
        let c = calculate_bankers_amount(50, 36);
        assert_eq!(format_cents(c), "0.00");

        // 150s at 0.36 -> 5400/3600 = 1.5 -> round to even (2) -> 0.02
        let c = calculate_bankers_amount(150, 36);
        assert_eq!(format_cents(c), "0.02");

        // 1s at 100.00 -> 100/3600 = 0.0277... -> round up to 3 -> 0.03
        let c = calculate_bankers_amount(1, 10000);
        assert_eq!(format_cents(c), "0.03");

        // 3600s at 0.00 -> 0.00
        let c = calculate_bankers_amount(3600, 0);
        assert_eq!(format_cents(c), "0.00");
    }

    #[test]
    fn test_resolve_effective_rate_4_levels() {
        let (persistence, db_path) = setup_test_persistence();
        let engine = Engine::new(&persistence);

        // Setup base project with currency
        let mut proj = Project::new(
            "p1".to_string(),
            "Billing Proj".to_string(),
            "#123456".to_string(),
            None,
            None,
            None,
            None,
        );
        proj.currency = Some("USD".to_string());
        proj.billing_currency = Some("USD".to_string());
        proj.hourly_rate = Some("120.00".to_string());
        proj.billing_rate_cents = Some(12000);
        persistence.projects.create(proj).expect("create proj");

        // Task 1: Level 1 Custom override rate
        let mut t1 = Task::new(
            "t1".to_string(),
            "p1".to_string(),
            None,
            "Custom Task".to_string(),
        );
        t1.hourly_rate = Some("200.00".to_string());
        t1.billing_rate_cents = Some(20000);
        persistence.tasks.create(t1).expect("create t1");

        let res1 = engine
            .resolve_effective_task_rate("t1")
            .expect("resolve t1");
        assert_eq!(res1.status, RateStatus::Custom);
        assert_eq!(res1.rate.as_deref(), Some("200.00"));
        assert_eq!(res1.currency.as_deref(), Some("USD"));
        assert_eq!(res1.source, "task");

        // Task 2: Level 1 Explicit Zero NonBillable
        let mut t2 = Task::new(
            "t2".to_string(),
            "p1".to_string(),
            None,
            "Pro Bono Task".to_string(),
        );
        t2.hourly_rate = Some("0.00".to_string());
        t2.billing_rate_cents = Some(0);
        persistence.tasks.create(t2).expect("create t2");

        let res2 = engine
            .resolve_effective_task_rate("t2")
            .expect("resolve t2");
        assert_eq!(res2.status, RateStatus::NonBillable);
        assert_eq!(res2.rate.as_deref(), Some("0.00"));
        assert_eq!(res2.currency.as_deref(), Some("USD"));
        assert_eq!(res2.source, "task");

        // Task 3: Level 2 Project Inheritance
        let t3 = Task::new(
            "t3".to_string(),
            "p1".to_string(),
            None,
            "Inheriting Task".to_string(),
        );
        persistence.tasks.create(t3).expect("create t3");

        let res3 = engine
            .resolve_effective_task_rate("t3")
            .expect("resolve t3");
        assert_eq!(res3.status, RateStatus::Inherited);
        assert_eq!(res3.rate.as_deref(), Some("120.00"));
        assert_eq!(res3.currency.as_deref(), Some("USD"));
        assert_eq!(res3.source, "project");

        // Setup Project 2 with no rate configured
        let mut proj2 = Project::new(
            "p2".to_string(),
            "Unconfigured Proj".to_string(),
            "#654321".to_string(),
            None,
            None,
            None,
            None,
        );
        proj2.currency = Some("EUR".to_string());
        persistence.projects.create(proj2).expect("create proj2");

        // Task 4: Level 4 Unconfigured (before Level 3 default is added)
        let t4 = Task::new(
            "t4".to_string(),
            "p2".to_string(),
            None,
            "Unconfigured Task".to_string(),
        );
        persistence.tasks.create(t4).expect("create t4");

        let res4 = engine
            .resolve_effective_task_rate("t4")
            .expect("resolve t4");
        assert_eq!(res4.status, RateStatus::Unconfigured);
        assert_eq!(res4.rate, None);
        assert_eq!(res4.currency.as_deref(), Some("EUR"));
        assert_eq!(res4.source, "none");

        // Level 3: Add runtime default config rate
        let default_config = RuntimeConfig {
            id: "default_billing_rate".to_string(),
            runtime: "billing_default".to_string(),
            config: "80.00".to_string(),
            created_at: "2026-10-31T00:00:00Z".to_string(),
        };
        persistence
            .settings
            .save_runtime_config(default_config)
            .expect("save default rate");

        let res4_default = engine
            .resolve_effective_task_rate("t4")
            .expect("resolve t4 with default");
        assert_eq!(res4_default.status, RateStatus::Inherited);
        assert_eq!(res4_default.rate.as_deref(), Some("80.00"));
        assert_eq!(res4_default.currency.as_deref(), Some("EUR"));
        assert_eq!(res4_default.source, "default");

        let _ = std::fs::remove_file(db_path);
    }

    #[test]
    fn test_range_billing_calculation() {
        let (persistence, db_path) = setup_test_persistence();
        let engine = Engine::new(&persistence);

        let mut proj = Project::new(
            "p1".to_string(),
            "Billing Range Proj".to_string(),
            "#123456".to_string(),
            None,
            None,
            None,
            None,
        );
        proj.currency = Some("USD".to_string());
        proj.hourly_rate = Some("150.00".to_string());
        persistence.projects.create(proj).expect("create proj");

        let mut t1 = Task::new(
            "t1".to_string(),
            "p1".to_string(),
            None,
            "Billable Task".to_string(),
        );
        t1.hourly_rate = Some("150.00".to_string());
        persistence.tasks.create(t1).expect("create t1");

        let mut t2 = Task::new(
            "t2".to_string(),
            "p1".to_string(),
            None,
            "NonBillable Task".to_string(),
        );
        t2.hourly_rate = Some("0.00".to_string());
        persistence.tasks.create(t2).expect("create t2");

        // Log 1: 3600 seconds on t1 (150.00 USD)
        persistence
            .time_logs
            .insert_full(&NewTimeLog {
                id: "l1".to_string(),
                task_id: "t1".to_string(),
                start_time: "2026-10-31T10:00:00Z".to_string(),
                end_time: Some("2026-10-31T11:00:00Z".to_string()),
                note: None,
            })
            .expect("log 1");

        // Log 2: 1800 seconds on t2 (NonBillable)
        persistence
            .time_logs
            .insert_full(&NewTimeLog {
                id: "l2".to_string(),
                task_id: "t2".to_string(),
                start_time: "2026-10-31T11:00:00Z".to_string(),
                end_time: Some("2026-10-31T11:30:00Z".to_string()),
                note: None,
            })
            .expect("log 2");

        let filter = ElapsedRangeFilter {
            from: Some("2026-10-31T00:00:00Z".to_string()),
            to: Some("2026-10-31T23:59:59Z".to_string()),
            project_id: None,
            task_id: None,
            include_patches: Some(false),
        };

        let result = engine
            .calculate_range_billing(&filter, None)
            .expect("calc billing");
        assert_eq!(result.total_billable_seconds, 3600);
        assert_eq!(result.total_non_billable_seconds, 1800);
        assert_eq!(result.total_unconfigured_seconds, 0);

        let usd_summary = result.by_currency.get("USD").expect("usd summary");
        assert_eq!(usd_summary.total_amount, "150.00");
        assert_eq!(usd_summary.billable_duration_seconds, 3600);
        assert_eq!(usd_summary.non_billable_duration_seconds, 1800);

        let _ = std::fs::remove_file(db_path);
    }
}
