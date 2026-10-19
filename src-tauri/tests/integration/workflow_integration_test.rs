use std::sync::{Arc, Mutex};

use chrono::{Duration, Local, TimeZone, Utc};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{TaskStatus, WorkflowCheckResult, REASON_DAILY_BOUNDARY, REASON_HOURS_LIMIT};
use oxy_flow::workflows::WorkflowDaemon;

use crate::shared::builders::{ProjectBuilder, TaskBuilder, WorkflowConfigBuilder};
use crate::shared::test_db::setup_persistence_test;

#[test]
fn test_given_active_timer_and_hours_limit_when_rules_checked_after_limit_then_timer_is_stopped() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("workflow_int_hours_limit");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("proj_wf_1")
        .with_name("WorkflowProj")
        .with_color("blue")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("task_wf_1")
        .with_project_id("proj_wf_1")
        .with_name("WorkflowTask")
        .with_status(TaskStatus::Todo)
        .build();
    persistence.tasks.create(task).unwrap();

    engine.start_timer("task_wf_1").unwrap();
    let state_running = engine.get_state().unwrap();
    assert!(state_running.active_log.is_some());

    let wf_config = WorkflowConfigBuilder::new()
        .with_hours_limit(true, 2.0)
        .build();
    persistence.workflow.save_config(&wf_config).unwrap();

    let daemon = WorkflowDaemon::new(None);
    let check_time_exceeded = Utc::now() + Duration::hours(3);

    // When
    let check_res = daemon.check_rules_now(&persistence, &wf_config, Some(check_time_exceeded));

    // Then
    assert!(check_res.stopped);
    assert_eq!(check_res.reason.as_deref(), Some(REASON_HOURS_LIMIT));

    let state_stopped = engine.get_state().unwrap();
    assert!(state_stopped.active_log.is_none());
}

#[test]
fn test_given_configured_daemon_with_event_sink_when_hours_limit_exceeded_then_daemon_status_tracks_stop_reason(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("workflow_int_event_sink");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("proj_wf_sink")
        .with_name("WorkflowSinkProj")
        .with_color("indigo")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("task_wf_sink")
        .with_project_id("proj_wf_sink")
        .with_name("WorkflowSinkTask")
        .with_status(TaskStatus::Todo)
        .build();
    persistence.tasks.create(task).unwrap();
    engine.start_timer("task_wf_sink").unwrap();

    let emitted_events: Arc<Mutex<Vec<(String, WorkflowCheckResult)>>> =
        Arc::new(Mutex::new(Vec::new()));
    let sink_events = Arc::clone(&emitted_events);

    let event_sink = Arc::new(move |event_name: &str, result: &WorkflowCheckResult| {
        sink_events
            .lock()
            .unwrap()
            .push((event_name.to_string(), result.clone()));
    });

    let daemon = WorkflowDaemon::new(Some(event_sink));
    let wf_config = WorkflowConfigBuilder::new()
        .with_hours_limit(true, 1.0)
        .build();
    let simulated_future_time = Utc::now() + Duration::minutes(70);

    // When
    let check_res = daemon.check_rules_now(&persistence, &wf_config, Some(simulated_future_time));

    // Then
    assert!(check_res.stopped);
    assert_eq!(check_res.reason.as_deref(), Some(REASON_HOURS_LIMIT));

    let daemon_status = daemon.get_status();
    assert_eq!(
        daemon_status.last_auto_stop_reason.as_deref(),
        Some(REASON_HOURS_LIMIT)
    );
    assert!(daemon_status.last_auto_stop_time_iso.is_some());
}

#[test]
fn test_given_active_log_crossing_daily_boundary_when_rules_checked_then_timer_is_stopped() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("workflow_int_daily_boundary");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("proj_boundary")
        .with_name("BoundaryProj")
        .with_color("green")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("task_boundary")
        .with_project_id("proj_boundary")
        .with_name("BoundaryTask")
        .with_status(TaskStatus::Todo)
        .build();
    persistence.tasks.create(task).unwrap();

    let now_date = Local::now().date_naive();
    let start_14_00 = Local
        .from_local_datetime(&now_date.and_hms_opt(14, 0, 0).unwrap())
        .unwrap()
        .with_timezone(&Utc);

    persistence
        .time_logs
        .insert(
            "log_boundary_14_00",
            "task_boundary",
            &start_14_00.to_rfc3339(),
        )
        .unwrap();

    let wf_config = WorkflowConfigBuilder::new()
        .with_daily_boundary(true, "18:00")
        .build();
    persistence.workflow.save_config(&wf_config).unwrap();

    let daemon = WorkflowDaemon::new(None);
    let now_18_30_utc = Local
        .from_local_datetime(&now_date.and_hms_opt(18, 30, 0).unwrap())
        .unwrap()
        .with_timezone(&Utc);

    // When
    let check_res = daemon.check_rules_now(&persistence, &wf_config, Some(now_18_30_utc));

    // Then
    assert!(check_res.stopped);
    assert_eq!(check_res.reason.as_deref(), Some(REASON_DAILY_BOUNDARY));

    let state = engine.get_state().unwrap();
    assert!(state.active_log.is_none());
}
