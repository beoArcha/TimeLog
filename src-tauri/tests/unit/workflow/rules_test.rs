use chrono::{Duration, Local, TimeZone, Utc};
use oxy_flow::types::{TimeLog, WorkflowConfig, REASON_DAILY_BOUNDARY, REASON_HOURS_LIMIT};
use oxy_flow::workflows::evaluate_rules;

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
    let active_logs = [running_log];

    // Act
    let result = evaluate_rules(&config, &active_logs, now);

    // Assert
    assert!(!result.stopped);
    assert!(result.reason.is_none());
    assert!(!result.warning);
}

#[test]
fn test_evaluate_rules_emits_warning_when_approaching_hours_limit() {
    // Arrange: timer ran for 3h 50m with a 4.0h limit (within 15-minute warning window)
    let now = Utc::now();
    let config = WorkflowConfig {
        auto_stop_hours_limit_enabled: true,
        auto_stop_hours_limit: 4.0,
        warning_notification_enabled: true,
        ..Default::default()
    };
    let running_log = TimeLog {
        id: "log_warn".into(),
        task_id: "t1".into(),
        project_id: "p1".into(),
        start_time: (now - Duration::minutes(230)).to_rfc3339(),
        end_time: None,
        note: None,
        edit_history: None,
    };
    let active_logs = [running_log];

    // Act
    let result = evaluate_rules(&config, &active_logs, now);

    // Assert
    assert!(!result.stopped);
    assert!(result.warning);
}

#[test]
fn test_evaluate_rules_emits_stop_when_hours_limit_is_exceeded() {
    // Arrange: timer ran for 4h 10m with a 4.0h limit
    let now = Utc::now();
    let config = WorkflowConfig {
        auto_stop_hours_limit_enabled: true,
        auto_stop_hours_limit: 4.0,
        warning_notification_enabled: true,
        ..Default::default()
    };
    let running_log = TimeLog {
        id: "log_exceeded".into(),
        task_id: "t1".into(),
        project_id: "p1".into(),
        start_time: (now - Duration::minutes(250)).to_rfc3339(),
        end_time: None,
        note: None,
        edit_history: None,
    };
    let active_logs = [running_log];

    // Act
    let result = evaluate_rules(&config, &active_logs, now);

    // Assert
    assert!(result.stopped);
    assert_eq!(result.reason.as_deref(), Some(REASON_HOURS_LIMIT));
}

#[test]
fn test_evaluate_rules_stops_timer_started_before_daily_boundary() {
    // Arrange: configure daily boundary at 17:00, simulate current local time at 17:30
    let today = Local::now().date_naive();
    let naive_boundary = today.and_hms_opt(17, 0, 0).unwrap();
    let local_boundary = Local.from_local_datetime(&naive_boundary).single().unwrap();

    let naive_now = today.and_hms_opt(17, 30, 0).unwrap();
    let local_now = Local.from_local_datetime(&naive_now).single().unwrap();
    let now_utc = local_now.with_timezone(&Utc);

    // Log started 30 mins before the boundary (16:30 local)
    let local_start = local_boundary - Duration::minutes(30);
    let start_utc = local_start.with_timezone(&Utc);

    let config = WorkflowConfig {
        auto_stop_daily_boundary_enabled: true,
        auto_stop_daily_boundary_time: "17:00".to_string(),
        warning_notification_enabled: false,
        ..Default::default()
    };
    let running_log = TimeLog {
        id: "log_boundary".into(),
        task_id: "t1".into(),
        project_id: "p1".into(),
        start_time: start_utc.to_rfc3339(),
        end_time: None,
        note: None,
        edit_history: None,
    };
    let active_logs = [running_log];

    // Act
    let result = evaluate_rules(&config, &active_logs, now_utc);

    // Assert
    assert!(result.stopped);
    assert_eq!(result.reason.as_deref(), Some(REASON_DAILY_BOUNDARY));
}

#[test]
fn test_evaluate_rules_allows_timer_started_after_daily_boundary() {
    // Arrange: boundary at 17:00, user manually started timer at 17:05, check at 17:30
    let today = Local::now().date_naive();
    let naive_boundary = today.and_hms_opt(17, 0, 0).unwrap();
    let local_boundary = Local.from_local_datetime(&naive_boundary).single().unwrap();

    let naive_now = today.and_hms_opt(17, 30, 0).unwrap();
    let local_now = Local.from_local_datetime(&naive_now).single().unwrap();
    let now_utc = local_now.with_timezone(&Utc);

    // Started 5 mins AFTER boundary
    let local_start = local_boundary + Duration::minutes(5);
    let start_utc = local_start.with_timezone(&Utc);

    let config = WorkflowConfig {
        auto_stop_daily_boundary_enabled: true,
        auto_stop_daily_boundary_time: "17:00".to_string(),
        warning_notification_enabled: false,
        ..Default::default()
    };
    let running_log = TimeLog {
        id: "log_post_boundary".into(),
        task_id: "t1".into(),
        project_id: "p1".into(),
        start_time: start_utc.to_rfc3339(),
        end_time: None,
        note: None,
        edit_history: None,
    };
    let active_logs = [running_log];

    // Act
    let result = evaluate_rules(&config, &active_logs, now_utc);

    // Assert: should NOT be stopped because it was intentionally started after today's boundary
    assert!(!result.stopped);
    assert!(result.reason.is_none());
}
