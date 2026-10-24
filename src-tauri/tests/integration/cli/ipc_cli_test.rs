use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::commands::cli::execute_command_string;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_empty_command_line_when_executed_then_returns_glance_dashboard() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("ipc_cli_empty_glance");
    let persistence = Persistence::new(&config).expect("failed to create persistence");

    // When
    let result = execute_command_string("", &persistence).expect("glance execution failed");

    // Then
    assert!(result.success);
    assert_eq!(result.exit_code, 0);
    assert!(result.envelope.is_none());
    assert!(result.stdout.contains("Dashboard"));
}

#[test]
fn test_given_existing_task_when_executing_start_command_then_starts_timer_and_returns_success() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("ipc_cli_start_task");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let project = ProjectBuilder::new()
        .with_id("proj_1")
        .with_name("Test Project")
        .build();
    let task = TaskBuilder::new()
        .with_id("task_1")
        .with_project_id("proj_1")
        .with_name("Feature Implementation")
        .build();
    persistence
        .projects
        .create(project)
        .expect("create project failed");
    persistence.tasks.create(task).expect("create task failed");

    // When
    let result =
        execute_command_string("start task_1", &persistence).expect("start command failed");

    // Then
    assert!(result.success);
    assert_eq!(result.exit_code, 0);
    assert!(result.envelope.is_none());
    assert!(result.stdout.contains("Started"));

    let engine = Engine::new(&persistence);
    let active_logs = engine.get_active_logs().expect("get active logs failed");
    assert_eq!(active_logs.len(), 1);
    assert_eq!(active_logs[0], "task_1");
}

#[test]
fn test_given_no_active_timer_when_executing_stop_command_then_returns_engine_conflict_error() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("ipc_cli_stop_idle");
    let persistence = Persistence::new(&config).expect("failed to create persistence");

    // When
    let result = execute_command_string("stop", &persistence);

    // Then
    assert!(result.is_err());
    let err_result = result.unwrap_err();
    assert!(!err_result.success);
    assert_eq!(err_result.exit_code, 5);
    assert!(err_result.envelope.is_some());
    let envelope = err_result.envelope.unwrap();
    assert_eq!(envelope.exit_code, 5);
}

#[test]
fn test_given_running_timer_when_executing_switch_command_then_switches_active_task() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("ipc_cli_switch_task");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let project = ProjectBuilder::new()
        .with_id("proj_sw")
        .with_name("Switch Project")
        .build();
    let task_a = TaskBuilder::new()
        .with_id("task_a")
        .with_project_id("proj_sw")
        .with_name("Task A")
        .build();
    let task_b = TaskBuilder::new()
        .with_id("task_b")
        .with_project_id("proj_sw")
        .with_name("Task B")
        .build();
    persistence
        .projects
        .create(project)
        .expect("create project failed");
    persistence
        .tasks
        .create(task_a)
        .expect("create task A failed");
    persistence
        .tasks
        .create(task_b)
        .expect("create task B failed");

    let engine = Engine::new(&persistence);
    engine
        .start_timer("task_a")
        .expect("start timer on task A failed");

    // When
    let result =
        execute_command_string("switch task_b", &persistence).expect("switch command failed");

    // Then
    assert!(result.success);
    assert_eq!(result.exit_code, 0);

    let active_logs = engine.get_active_logs().expect("get active logs failed");
    assert_eq!(active_logs.len(), 1);
    assert_eq!(active_logs[0], "task_b");
}

#[test]
fn test_given_invalid_syntax_when_executing_command_then_returns_syntax_error_envelope() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("ipc_cli_invalid_syntax");
    let persistence = Persistence::new(&config).expect("failed to create persistence");

    // When
    let result = execute_command_string("invalid_command_xyz", &persistence);

    // Then
    assert!(result.is_err());
    let err_result = result.unwrap_err();
    assert!(!err_result.success);
    assert_eq!(err_result.exit_code, 2);
    assert!(err_result.envelope.is_some());
    let envelope = err_result.envelope.unwrap();
    assert_eq!(envelope.exit_code, 2);
    assert!(err_result.stdout.contains("error"));
}
