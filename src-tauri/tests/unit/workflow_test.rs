use chrono::{Duration, Local, TimeZone, Utc};
use oxy_flow::persistence::Persistence;
use oxy_flow::repositories::config::ConfigRepository;
use oxy_flow::types::{
    TimeLog, WorkflowConfig, DEFAULT_AUTO_STOP_DAILY_BOUNDARY_TIME, DEFAULT_AUTO_STOP_HOURS_LIMIT,
    REASON_DAILY_BOUNDARY, REASON_HOURS_LIMIT,
};
use oxy_flow::workflows::{evaluate_rules, WorkflowDaemon};
use std::path::PathBuf;
use std::sync::Arc;

fn setup_test_config_repo(test_name: &str) -> (ConfigRepository, PathBuf) {
    let db_path = std::env::temp_dir().join(format!("{}.db", test_name));
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = ConfigRepository::new(&db_path).unwrap();
    (repo, db_path)
}

#[test]
fn test_workflow_config_repository_returns_defaults_when_missing() {
    // Arrange
    let (repo, db_path) = setup_test_config_repo("test_workflow_cfg_defaults");

    // Act
    let default_cfg = repo.get_workflow_config().unwrap();

    // Assert
    assert!(!default_cfg.auto_stop_hours_limit_enabled);
    assert_eq!(
        default_cfg.auto_stop_hours_limit,
        DEFAULT_AUTO_STOP_HOURS_LIMIT
    );
    assert_eq!(
        default_cfg.auto_stop_daily_boundary_time,
        DEFAULT_AUTO_STOP_DAILY_BOUNDARY_TIME
    );

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_workflow_config_repository_saves_and_retrieves_custom_config() {
    // Arrange
    let (repo, db_path) = setup_test_config_repo("test_workflow_cfg_custom");
    let custom_cfg = WorkflowConfig {
        auto_stop_hours_limit_enabled: true,
        auto_stop_hours_limit: 6.5,
        auto_stop_daily_boundary_enabled: true,
        auto_stop_daily_boundary_time: "18:30".to_string(),
        auto_stop_on_task_complete: true,
        warning_notification_enabled: false,
    };

    // Act
    repo.save_workflow_config(&custom_cfg).unwrap();
    let loaded_cfg = repo.get_workflow_config().unwrap();

    // Assert
    assert_eq!(custom_cfg, loaded_cfg);

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_evaluate_rules_returns_empty_when_no_active_logs() {
    // Arrange
    let config = WorkflowConfig {
        auto_stop_hours_limit_enabled: true,
        auto_stop_hours_limit: 8.0,
        ..Default::default()
    };
    let active_logs: [TimeLog; 0] = [];
    let now = Utc::now();

    // Act
    let result = evaluate_rules(&config, &active_logs, now);

    // Assert
    assert!(!result.stopped);
    assert!(result.reason.is_none());
    assert!(!result.warning);
}

#[test]
fn test_evaluate_rules_does_not_stop_when_elapsed_time_is_under_limit() {
    // Arrange
    let now = Utc::now();
    let config = WorkflowConfig {
        auto_stop_hours_limit_enabled: true,
        auto_stop_hours_limit: 4.0,
        warning_notification_enabled: true,
        ..Default::default()
    };
    let running_log = TimeLog {
        id: "log_under_limit".into(),
        task_id: "t1".into(),
        project_id: "p1".into(),
        start_time: (now - Duration::hours(2)).to_rfc3339(),
        end_time: None,
        note: None,
        edit_history: None,
    };

    // Act
    let result = evaluate_rules(&config, &[running_log], now);

    // Assert
    assert!(!result.stopped);
    assert!(!result.warning);
    assert!(result.reason.is_none());
}

#[test]
fn test_evaluate_rules_emits_warning_when_approaching_hours_limit() {
    // Arrange
    let now = Utc::now();
    let config = WorkflowConfig {
        auto_stop_hours_limit_enabled: true,
        auto_stop_hours_limit: 4.0,
        warning_notification_enabled: true,
        ..Default::default()
    };
    // 3h50m elapsed = 10m before the 4h limit (within the 15m warning window)
    let warning_log = TimeLog {
        id: "log_approaching_limit".into(),
        task_id: "t1".into(),
        project_id: "p1".into(),
        start_time: (now - Duration::minutes(230)).to_rfc3339(),
        end_time: None,
        note: None,
        edit_history: None,
    };

    // Act
    let result = evaluate_rules(&config, &[warning_log], now);

    // Assert
    assert!(!result.stopped);
    assert!(result.warning);
    assert!(result.reason.is_none());
}

#[test]
fn test_evaluate_rules_emits_stop_when_hours_limit_is_exceeded() {
    // Arrange
    let now = Utc::now();
    let config = WorkflowConfig {
        auto_stop_hours_limit_enabled: true,
        auto_stop_hours_limit: 4.0,
        warning_notification_enabled: true,
        ..Default::default()
    };
    // 4h05m elapsed = exceeds the 4h limit
    let exceeding_log = TimeLog {
        id: "log_exceeded_limit".into(),
        task_id: "t1".into(),
        project_id: "p1".into(),
        start_time: (now - Duration::minutes(245)).to_rfc3339(),
        end_time: None,
        note: None,
        edit_history: None,
    };

    // Act
    let result = evaluate_rules(&config, &[exceeding_log], now);

    // Assert
    assert!(result.stopped);
    assert_eq!(result.reason.as_deref(), Some(REASON_HOURS_LIMIT));
}

#[test]
fn test_evaluate_rules_stops_timer_started_before_daily_boundary() {
    // Arrange
    let now_local = Local::now();
    let now_date = now_local.date_naive();
    let config = WorkflowConfig {
        auto_stop_daily_boundary_enabled: true,
        auto_stop_daily_boundary_time: "18:00".to_string(),
        warning_notification_enabled: true,
        ..Default::default()
    };

    let time_18_30 = now_date.and_hms_opt(18, 30, 0).unwrap();
    let now_18_30_utc = Local
        .from_local_datetime(&time_18_30)
        .unwrap()
        .with_timezone(&Utc);

    let start_14_00 = now_date.and_hms_opt(14, 0, 0).unwrap();
    let start_14_00_utc = Local
        .from_local_datetime(&start_14_00)
        .unwrap()
        .with_timezone(&Utc);

    let early_log = TimeLog {
        id: "log_early".into(),
        task_id: "t1".into(),
        project_id: "p1".into(),
        start_time: start_14_00_utc.to_rfc3339(),
        end_time: None,
        note: None,
        edit_history: None,
    };

    // Act
    let result = evaluate_rules(&config, &[early_log], now_18_30_utc);

    // Assert
    assert!(result.stopped);
    assert_eq!(result.reason.as_deref(), Some(REASON_DAILY_BOUNDARY));
}

#[test]
fn test_evaluate_rules_allows_timer_started_after_daily_boundary() {
    // Arrange
    let now_local = Local::now();
    let now_date = now_local.date_naive();
    let config = WorkflowConfig {
        auto_stop_daily_boundary_enabled: true,
        auto_stop_daily_boundary_time: "18:00".to_string(),
        warning_notification_enabled: true,
        ..Default::default()
    };

    let time_18_30 = now_date.and_hms_opt(18, 30, 0).unwrap();
    let now_18_30_utc = Local
        .from_local_datetime(&time_18_30)
        .unwrap()
        .with_timezone(&Utc);

    // Started at 18:15 (after the 18:00 boundary) -> user intentionally started evening work
    let start_18_15 = now_date.and_hms_opt(18, 15, 0).unwrap();
    let start_18_15_utc = Local
        .from_local_datetime(&start_18_15)
        .unwrap()
        .with_timezone(&Utc);

    let evening_log = TimeLog {
        id: "log_evening".into(),
        task_id: "t1".into(),
        project_id: "p1".into(),
        start_time: start_18_15_utc.to_rfc3339(),
        end_time: None,
        note: None,
        edit_history: None,
    };

    // Act
    let result = evaluate_rules(&config, &[evening_log], now_18_30_utc);

    // Assert
    assert!(!result.stopped);
    assert!(result.reason.is_none());
}

#[test]
fn test_workflow_daemon_initial_state_is_idle() {
    // Arrange
    let daemon = WorkflowDaemon::new(None);

    // Act
    let is_running = daemon.is_running();
    let status = daemon.get_status();

    // Assert
    assert!(!is_running);
    assert!(!status.is_daemon_running);
}

#[test]
fn test_workflow_daemon_start_sets_running_state() {
    // Arrange
    let (_conn, config, _temp_dir) =
        crate::shared::test_db::setup_persistence_test("test_daemon_start");
    let persistence = Arc::new(Persistence::new(&config).unwrap());
    let daemon = WorkflowDaemon::new(None);

    // Act
    daemon.start(persistence);

    // Assert
    assert!(daemon.is_running());
    assert!(daemon.get_status().is_daemon_running);
}

#[test]
fn test_workflow_daemon_stop_sets_stopped_state() {
    // Arrange
    let (_conn, config, _temp_dir) =
        crate::shared::test_db::setup_persistence_test("test_daemon_stop");
    let persistence = Arc::new(Persistence::new(&config).unwrap());
    let daemon = WorkflowDaemon::new(None);
    daemon.start(persistence);

    // Act
    daemon.stop();

    // Assert
    assert!(!daemon.is_running());
    assert!(!daemon.get_status().is_daemon_running);
}

#[test]
fn test_workflow_daemon_check_rules_now_updates_status() {
    // Arrange
    let (_conn, config, _temp_dir) =
        crate::shared::test_db::setup_persistence_test("test_daemon_check_status");
    let persistence = Arc::new(Persistence::new(&config).unwrap());
    let daemon = WorkflowDaemon::new(None);
    let cfg = WorkflowConfig::default();
    let check_time = Utc::now();

    // Act
    let check_res = daemon.check_rules_now(&persistence, &cfg, Some(check_time));

    // Assert
    assert!(!check_res.stopped);
    let post_status = daemon.get_status();
    assert_eq!(
        post_status.last_check_iso.as_deref(),
        Some(check_time.to_rfc3339().as_str())
    );
}
