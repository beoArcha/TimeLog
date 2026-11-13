use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxyflow_timelog::cli::handlers::flow_handler::{build_dashboard_payload, handle_glance};
use oxyflow_timelog::cli::CliOutput;
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::NewTimeLog;

#[test]
fn test_given_idle_system_when_building_dashboard_dto_then_returns_idle_state() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_dashboard_dto_idle");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    // Act
    let payload_res = build_dashboard_payload(&persistence, &engine, None);

    // Assert
    assert!(payload_res.is_ok());
    let payload = payload_res.unwrap();
    assert!(!payload.running);
    assert_eq!(payload.active_session, None);
    assert_eq!(payload.session_count, 0);
    assert_eq!(payload.today_total_seconds, 0);
    assert!(payload.recent_tasks.is_empty());
}

#[test]
fn test_given_active_timer_and_today_logs_when_building_dashboard_dto_then_includes_session_and_recents(
) {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_dashboard_dto_active");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p-dash-01")
        .with_name("Core API")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-dash-01")
        .with_project_id("p-dash-01")
        .with_name("Authentication Handler")
        .build();
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();

    let now = chrono::Utc::now();
    let today_prefix = now.format("%Y-%m-%d").to_string();
    let log1 = NewTimeLog {
        id: "l-dash-01".to_string(),
        task_id: "t-dash-01".to_string(),
        start_time: format!("{}T08:00:00Z", today_prefix),
        end_time: Some(format!("{}T09:00:00Z", today_prefix)),
        note: Some("Morning refactor".to_string()),
    };
    persistence.time_logs.insert_full(&log1).unwrap();

    engine.start_timer("t-dash-01").unwrap();

    // Act
    let payload_res = build_dashboard_payload(&persistence, &engine, None);

    // Assert
    assert!(payload_res.is_ok());
    let payload = payload_res.unwrap();
    assert!(payload.running);
    assert!(payload.active_session.is_some());
    let active = payload.active_session.unwrap();
    assert_eq!(active.task_id, "t-dash-01");
    assert_eq!(active.task_name, "Authentication Handler");
    assert_eq!(active.project_name, "Core API");
    assert_eq!(payload.session_count, 2);
    assert_eq!(payload.recent_tasks.len(), 2);
    assert_eq!(payload.recent_tasks[0].task_name, "Authentication Handler");
}

#[test]
fn test_given_machine_flag_when_handle_glance_then_outputs_dashboard_envelope() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_dashboard_glance_machine");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    // Act
    let result = handle_glance(true, &persistence, &engine, None);

    // Assert
    assert!(result.is_ok());
    if let CliOutput::Envelope(envelope) = result.unwrap() {
        assert_eq!(envelope.schema, "oxy.dashboard");
        assert_eq!(envelope.data["running"], false);
        assert_eq!(envelope.data["sessionCount"], 0);
        assert!(envelope.data["todayDate"].is_string());
    } else {
        panic!("Expected Envelope output variant");
    }
}

#[test]
fn test_given_terminal_mode_when_handle_glance_then_renders_visual_cards() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_dashboard_glance_terminal");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    // Act
    let result = handle_glance(false, &persistence, &engine, None);

    // Assert
    assert!(result.is_ok());
    if let CliOutput::Success(text) = result.unwrap() {
        assert!(text.contains("Quick Status Dashboard"));
        assert!(text.contains("Active Tracking Session"));
        assert!(text.contains("Today's Progress"));
        assert!(text.contains("Recent Activity"));
        assert!(text.contains("Tip:"));
    } else {
        panic!("Expected Success output variant");
    }
}
