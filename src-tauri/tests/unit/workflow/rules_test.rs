use crate::shared::builders::{TimeLogBuilder, WorkflowConfigBuilder};
use chrono::{Duration, Local, TimeZone, Utc};
use oxy_flow::types::{TimeLog, REASON_DAILY_BOUNDARY, REASON_HOURS_LIMIT};
use oxy_flow::workflows::evaluate_rules;

#[test]
fn test_evaluate_rules_returns_empty_when_no_active_logs() {
    // Arrange
    let config = WorkflowConfigBuilder::new()
        .with_hours_limit(true, 8.0)
        .build();
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
    let config = WorkflowConfigBuilder::new()
        .with_hours_limit(true, 4.0)
        .with_warning(true)
        .build();
    let running_log = TimeLogBuilder::new()
        .with_id("log_under_limit")
        .with_task_id("t1")
        .with_project_id("p1")
        .with_start_time((now - Duration::hours(2)).to_rfc3339())
        .running()
        .build();
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
    let config = WorkflowConfigBuilder::new()
        .with_hours_limit(true, 4.0)
        .with_warning(true)
        .build();
    let running_log = TimeLogBuilder::new()
        .with_id("log_warn")
        .with_task_id("t1")
        .with_project_id("p1")
        .with_start_time((now - Duration::minutes(230)).to_rfc3339())
        .running()
        .build();
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
    let config = WorkflowConfigBuilder::new()
        .with_hours_limit(true, 4.0)
        .with_warning(true)
        .build();
    let running_log = TimeLogBuilder::new()
        .with_id("log_exceeded")
        .with_task_id("t1")
        .with_project_id("p1")
        .with_start_time((now - Duration::minutes(250)).to_rfc3339())
        .running()
        .build();
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

    let config = WorkflowConfigBuilder::new()
        .with_daily_boundary(true, "17:00")
        .with_warning(false)
        .build();
    let running_log = TimeLogBuilder::new()
        .with_id("log_boundary")
        .with_task_id("t1")
        .with_project_id("p1")
        .with_start_time(start_utc.to_rfc3339())
        .running()
        .build();
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

    let config = WorkflowConfigBuilder::new()
        .with_daily_boundary(true, "17:00")
        .with_warning(false)
        .build();
    let running_log = TimeLogBuilder::new()
        .with_id("log_post_boundary")
        .with_task_id("t1")
        .with_project_id("p1")
        .with_start_time(start_utc.to_rfc3339())
        .running()
        .build();
    let active_logs = [running_log];

    // Act
    let result = evaluate_rules(&config, &active_logs, now_utc);

    // Assert: should NOT be stopped because it was intentionally started after today's boundary
    assert!(!result.stopped);
    assert!(result.reason.is_none());
}
