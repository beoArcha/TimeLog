use oxy_flow::engine::billing::{
    calculate_bankers_amount, format_cents, parse_rate_or_cents, parse_rate_to_cents,
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
