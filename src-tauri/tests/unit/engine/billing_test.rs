use oxy_flow::engine::billing::{
    calculate_bankers_amount, format_cents, normalize_currency, parse_rate_or_cents,
    parse_rate_to_cents, resolve_effective_currency, resolve_effective_rate,
    validate_and_parse_rate, validate_currency_code,
};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::{Persistence, PersistenceConfig};
use oxy_flow::types::{ElapsedRangeFilter, NewTimeLog, Project, RateStatus, RuntimeConfig, Task};

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
fn test_parse_rate_and_boundaries() {
    assert_eq!(parse_rate_to_cents("150"), Some(15000));
    assert_eq!(parse_rate_to_cents("150.00"), Some(15000));
    assert_eq!(parse_rate_to_cents("150.5"), Some(15050));
    assert_eq!(parse_rate_to_cents("150.55"), Some(15055));
    assert_eq!(parse_rate_to_cents("0"), Some(0));
    assert_eq!(parse_rate_to_cents("0.00"), Some(0));
    assert_eq!(parse_rate_to_cents("150.999"), None);
    assert_eq!(parse_rate_to_cents("150.1234"), None);
    assert_eq!(parse_rate_to_cents(""), None);
    assert_eq!(parse_rate_to_cents("-10"), None);

    // Boundary tests on both sides of 1000 for major units
    assert_eq!(parse_rate_or_cents("999"), Some(99900));
    assert_eq!(parse_rate_or_cents("1000"), Some(100000));
    assert_eq!(parse_rate_or_cents("1001"), Some(100100));
    assert_eq!(parse_rate_or_cents("150.00"), Some(15000));
    assert_eq!(parse_rate_or_cents("150"), Some(15000));

    // Boundary tests on both sides of 1000 for explicit cents suffix
    assert_eq!(parse_rate_or_cents("500c"), Some(500));
    assert_eq!(parse_rate_or_cents("999c"), Some(999));
    assert_eq!(parse_rate_or_cents("1000c"), Some(1000));
    assert_eq!(parse_rate_or_cents("1001c"), Some(1001));
    assert_eq!(parse_rate_or_cents("15000c"), Some(15000));
}

#[test]
fn test_validation_rate_and_currency() {
    // Valid rates
    assert_eq!(validate_and_parse_rate("150.00").unwrap(), 15000);
    assert_eq!(validate_and_parse_rate("999").unwrap(), 99900);
    assert_eq!(validate_and_parse_rate("1000").unwrap(), 100000);
    assert_eq!(validate_and_parse_rate("0.00").unwrap(), 0);

    // Invalid rates
    assert!(validate_and_parse_rate("").is_err());
    assert!(validate_and_parse_rate("-10").is_err());
    assert!(validate_and_parse_rate("150.555").is_err()); // > 2 decimal places
    assert!(validate_and_parse_rate("150.999").is_err()); // > 2 decimal places
    assert!(validate_and_parse_rate("abc").is_err());

    // Valid currencies
    assert_eq!(validate_currency_code("USD").unwrap(), "USD");
    assert_eq!(validate_currency_code("eur").unwrap(), "EUR");
    assert_eq!(validate_currency_code(" pln ").unwrap(), "PLN");

    // Invalid currencies
    assert!(validate_currency_code("").is_err());
    assert!(validate_currency_code("US").is_err());
    assert!(validate_currency_code("USDD").is_err());
    assert!(validate_currency_code("123").is_err());
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

#[test]
fn test_normalize_currency_parity() {
    assert_eq!(normalize_currency(Some("usd")), Some("USD".to_string()));
    assert_eq!(normalize_currency(Some("  eur  ")), Some("EUR".to_string()));
    assert_eq!(normalize_currency(Some("")), None);
    assert_eq!(normalize_currency(Some("   ")), None);
    assert_eq!(normalize_currency(None), None);

    // Precedence: task billingCurrency > task currency > project billingCurrency > project currency
    let mut task = Task::new("t1".to_string(), "p1".to_string(), None, "T1".to_string());
    let mut project = Project::new(
        "p1".to_string(),
        "P1".to_string(),
        "#000".to_string(),
        None,
        None,
        None,
        None,
    );

    // Project currency fallback
    project.currency = Some("  usd  ".to_string());
    assert_eq!(
        resolve_effective_currency(&task, Some(&project)),
        Some("USD".to_string())
    );

    // Project billingCurrency overrides project currency
    project.billing_currency = Some("eur".to_string());
    assert_eq!(
        resolve_effective_currency(&task, Some(&project)),
        Some("EUR".to_string())
    );

    // Task currency overrides project billingCurrency
    task.currency = Some("  gbp  ".to_string());
    assert_eq!(
        resolve_effective_currency(&task, Some(&project)),
        Some("GBP".to_string())
    );

    // Task billingCurrency overrides task currency
    task.billing_currency = Some("chf".to_string());
    assert_eq!(
        resolve_effective_currency(&task, Some(&project)),
        Some("CHF".to_string())
    );

    // Whitespace-only task billingCurrency falls through to task currency
    task.billing_currency = Some("   ".to_string());
    assert_eq!(
        resolve_effective_currency(&task, Some(&project)),
        Some("GBP".to_string())
    );

    // None when everything is empty or whitespace
    task.currency = Some("".to_string());
    project.billing_currency = Some("  ".to_string());
    project.currency = None;
    assert_eq!(resolve_effective_currency(&task, Some(&project)), None);
}

#[test]
fn test_parity_vectors_shared_fixture() {
    let fixture_str = include_str!("../../../../tests/fixtures/billing-parity-vectors.json");
    let fixture: serde_json::Value =
        serde_json::from_str(fixture_str).expect("parse shared fixture");

    // 1. Test rounding vectors
    for vec in fixture["roundingVectors"].as_array().unwrap() {
        let desc = vec["description"].as_str().unwrap();
        let duration = vec["durationSeconds"].as_u64().unwrap();
        let rate_str = vec["rate"].as_str().unwrap();
        let expected_amount = vec["expectedAmount"].as_str().unwrap();
        let rate_cents = parse_rate_to_cents(rate_str).expect("valid rate");
        let calculated = calculate_bankers_amount(duration, rate_cents);
        assert_eq!(
            format_cents(calculated),
            expected_amount,
            "Rounding parity failure for: {desc}"
        );
    }

    // 2. Test rate parsing vectors
    for vec in fixture["rateParsingVectors"].as_array().unwrap() {
        let desc = vec["description"].as_str().unwrap();
        let input = vec["input"].as_str().unwrap();
        let expected_cents = vec["expectedCents"].as_u64();
        let valid = vec["valid"].as_bool().unwrap();

        let parsed = parse_rate_to_cents(input);
        if valid {
            assert_eq!(parsed, expected_cents, "Parsed cents mismatch for {desc}");
        } else {
            assert_eq!(parsed, None, "Expected invalid for {desc}");
        }
    }

    // 3. Test rate resolution vectors
    for vec in fixture["rateResolutionVectors"].as_array().unwrap() {
        let desc = vec["description"].as_str().unwrap();
        let task_rate = vec["taskRate"].as_str().map(|s| s.to_string());
        let task_billing_rate_cents = vec["taskBillingRateCents"].as_i64();
        let task_currency = vec["taskCurrency"].as_str().map(|s| s.to_string());
        let task_billing_currency = vec["taskBillingCurrency"].as_str().map(|s| s.to_string());

        let mut task = Task::new("t1".to_string(), "p1".to_string(), None, "T1".to_string());
        task.hourly_rate = task_rate;
        task.billing_rate_cents = task_billing_rate_cents;
        task.currency = task_currency;
        task.billing_currency = task_billing_currency;

        let mut project = Project::new(
            "p1".to_string(),
            "P1".to_string(),
            "#000".to_string(),
            None,
            None,
            None,
            None,
        );
        project.hourly_rate = vec["projectRate"].as_str().map(|s| s.to_string());
        project.billing_rate_cents = vec["projectBillingRateCents"].as_i64();
        project.currency = vec["projectCurrency"].as_str().map(|s| s.to_string());
        project.billing_currency = vec["projectBillingCurrency"]
            .as_str()
            .map(|s| s.to_string());

        let default_rate_cents = vec["runtimeDefaultRate"]
            .as_str()
            .and_then(parse_rate_to_cents);

        let res = resolve_effective_rate(&task, Some(&project), default_rate_cents);

        let expected_status = vec["expectedStatus"].as_str().unwrap();
        let expected_rate = vec["expectedRate"].as_str();
        let expected_currency = vec["expectedCurrency"].as_str();
        let expected_source = vec["expectedSource"].as_str().unwrap();

        let actual_status_str = match res.status {
            RateStatus::Custom => "custom",
            RateStatus::Inherited => "inherited",
            RateStatus::NonBillable => "non_billable",
            RateStatus::Unconfigured => "unconfigured",
        };

        assert_eq!(
            actual_status_str, expected_status,
            "Status mismatch for {desc}"
        );
        assert_eq!(
            res.rate.as_deref(),
            expected_rate,
            "Rate mismatch for {desc}"
        );
        assert_eq!(
            res.currency.as_deref(),
            expected_currency,
            "Currency mismatch for {desc}"
        );
        assert_eq!(res.source, expected_source, "Source mismatch for {desc}");
    }
}
