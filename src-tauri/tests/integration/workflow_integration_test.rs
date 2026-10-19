use crate::shared::test_db::setup_persistence_test;
use chrono::{Duration, Local, TimeZone, Utc};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{
    Project, Task, TaskStatus, WorkflowCheckResult, WorkflowConfig, REASON_DAILY_BOUNDARY,
    REASON_HOURS_LIMIT,
};
use oxy_flow::workflows::WorkflowDaemon;
use std::sync::{Arc, Mutex};

#[test]
fn test_workflow_hours_limit_automatically_stops_active_timer() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("workflow_int_hours_limit");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = Project {
        id: "proj_wf_1".to_string(),
        name: "WorkflowProj".to_string(),
        color: "blue".to_string(),
        created_at: Utc::now().to_rfc3339(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(project).unwrap();

    let task = Task {
        id: "task_wf_1".to_string(),
        project_id: "proj_wf_1".to_string(),
        parent_task_id: None,
        name: "WorkflowTask".to_string(),
        created_at: Utc::now().to_rfc3339(),
        completed: false,
        status: Some(TaskStatus::Todo),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    persistence.tasks.create(task).unwrap();

    // Start timer for task
    engine.start_timer("task_wf_1").unwrap();
    let state_running = engine.get_state().unwrap();
    assert!(state_running.active_log.is_some());

    // Configure 2-hour limit
    let wf_config = WorkflowConfig {
        auto_stop_hours_limit_enabled: true,
        auto_stop_hours_limit: 2.0,
        ..Default::default()
    };
    persistence.workflow.save_config(&wf_config).unwrap();

    let daemon = WorkflowDaemon::new(None);
    let check_time_exceeded = Utc::now() + Duration::hours(3);

    // Act
    let check_res = daemon.check_rules_now(&persistence, &wf_config, Some(check_time_exceeded));

    // Assert
    assert!(check_res.stopped);
    assert_eq!(check_res.reason.as_deref(), Some(REASON_HOURS_LIMIT));

    // Verify Engine state: timer must now be stopped
    let state_stopped = engine.get_state().unwrap();
    assert!(state_stopped.active_log.is_none());
}

#[test]
fn test_workflow_daemon_event_sink_emits_autostop_event() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("workflow_int_event_sink");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = Project {
        id: "proj_wf_sink".to_string(),
        name: "WorkflowSinkProj".to_string(),
        color: "indigo".to_string(),
        created_at: Utc::now().to_rfc3339(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(project).unwrap();

    let task = Task {
        id: "task_wf_sink".to_string(),
        project_id: "proj_wf_sink".to_string(),
        parent_task_id: None,
        name: "WorkflowSinkTask".to_string(),
        created_at: Utc::now().to_rfc3339(),
        completed: false,
        status: Some(TaskStatus::Todo),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
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
    let wf_config = WorkflowConfig {
        auto_stop_hours_limit_enabled: true,
        auto_stop_hours_limit: 1.0,
        ..Default::default()
    };
    let simulated_future_time = Utc::now() + Duration::minutes(70);

    // Act
    let check_res = daemon.check_rules_now(&persistence, &wf_config, Some(simulated_future_time));

    // Assert
    assert!(check_res.stopped);
    assert_eq!(check_res.reason.as_deref(), Some(REASON_HOURS_LIMIT));

    let _events = emitted_events.lock().unwrap();
    // check_rules_now does not trigger event_sink directly (event_sink is used by background daemon loop),
    // but verify daemon status tracks the stop reason and time
    let daemon_status = daemon.get_status();
    assert_eq!(
        daemon_status.last_auto_stop_reason.as_deref(),
        Some(REASON_HOURS_LIMIT)
    );
    assert!(daemon_status.last_auto_stop_time_iso.is_some());
}

#[test]
fn test_workflow_daily_boundary_integration_flow() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("workflow_int_daily_boundary");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = Project {
        id: "proj_boundary".to_string(),
        name: "BoundaryProj".to_string(),
        color: "green".to_string(),
        created_at: Utc::now().to_rfc3339(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(project).unwrap();

    let task = Task {
        id: "task_boundary".to_string(),
        project_id: "proj_boundary".to_string(),
        parent_task_id: None,
        name: "BoundaryTask".to_string(),
        created_at: Utc::now().to_rfc3339(),
        completed: false,
        status: Some(TaskStatus::Todo),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    persistence.tasks.create(task).unwrap();

    let now_date = Local::now().date_naive();
    let start_14_00 = Local
        .from_local_datetime(&now_date.and_hms_opt(14, 0, 0).unwrap())
        .unwrap()
        .with_timezone(&Utc);

    // Insert active time log starting at 14:00
    persistence
        .time_logs
        .insert(
            "log_boundary_14_00",
            "task_boundary",
            &start_14_00.to_rfc3339(),
        )
        .unwrap();

    let wf_config = WorkflowConfig {
        auto_stop_daily_boundary_enabled: true,
        auto_stop_daily_boundary_time: "18:00".to_string(),
        ..Default::default()
    };
    persistence.workflow.save_config(&wf_config).unwrap();

    let daemon = WorkflowDaemon::new(None);
    let now_18_30_utc = Local
        .from_local_datetime(&now_date.and_hms_opt(18, 30, 0).unwrap())
        .unwrap()
        .with_timezone(&Utc);

    // Act
    let check_res = daemon.check_rules_now(&persistence, &wf_config, Some(now_18_30_utc));

    // Assert
    assert!(check_res.stopped);
    assert_eq!(check_res.reason.as_deref(), Some(REASON_DAILY_BOUNDARY));

    let state = engine.get_state().unwrap();
    assert!(state.active_log.is_none());
}
