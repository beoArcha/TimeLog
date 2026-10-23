use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::{handle_cli, CliArgs, CliOutput};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_clean_database_when_executing_full_cli_lifecycle_then_entities_and_timer_transition_correctly(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_cli_lifecycle_full");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    // When
    let add_proj_args =
        CliArgs::try_parse_from(["oxy", "project", "add", "Lifecycle Proj", "--color", "teal"])
            .unwrap();
    let proj_res = handle_cli(add_proj_args, &persistence, &engine);

    let projects = persistence.projects.get_all().unwrap();
    let proj_id = projects.first().map(|p| p.id.clone()).unwrap_or_default();

    let add_task_args =
        CliArgs::try_parse_from(["oxy", "task", "add", "Main Feature", "-p", &proj_id]).unwrap();
    let task_res = handle_cli(add_task_args, &persistence, &engine);

    let tasks = persistence.tasks.get_all().unwrap();
    let parent_task_id = tasks.first().map(|t| t.id.clone()).unwrap_or_default();

    let add_subtask_args = CliArgs::try_parse_from([
        "oxy",
        "task",
        "add",
        "Subfeature Implementation",
        "-p",
        &proj_id,
        "--parent",
        &parent_task_id,
    ])
    .unwrap();
    let subtask_res = handle_cli(add_subtask_args, &persistence, &engine);

    let start_args = CliArgs::try_parse_from(["oxy", "start", "Main Feature"]).unwrap();
    let start_res = handle_cli(start_args, &persistence, &engine);
    let active_at_start = engine.get_active_logs().unwrap();

    let switch_args = CliArgs::try_parse_from(["oxy", "sw", "Subfeature"]).unwrap();
    let switch_res = handle_cli(switch_args, &persistence, &engine);
    let active_after_switch = engine.get_active_logs().unwrap();

    let status_args = CliArgs::try_parse_from(["oxy", "status"]).unwrap();
    let status_res = handle_cli(status_args, &persistence, &engine);

    let stop_args = CliArgs::try_parse_from(["oxy", "stop"]).unwrap();
    let stop_res = handle_cli(stop_args, &persistence, &engine);

    let done_args = CliArgs::try_parse_from(["oxy", "task", "done", "Subfeature"]).unwrap();
    let done_res = handle_cli(done_args, &persistence, &engine);

    // Then
    assert!(proj_res.is_ok(), "Project creation should succeed");
    assert_eq!(projects.len(), 1);
    assert_eq!(projects[0].name, "Lifecycle Proj");

    assert!(task_res.is_ok(), "Task creation should succeed");
    assert_eq!(tasks.len(), 1);

    assert!(subtask_res.is_ok(), "Subtask creation should succeed");
    assert!(start_res.is_ok(), "Timer start should succeed");
    assert_eq!(active_at_start, vec![parent_task_id.clone()]);

    assert!(switch_res.is_ok(), "Timer switch should succeed");
    assert_eq!(active_after_switch.len(), 1);
    assert_ne!(active_after_switch[0], parent_task_id);

    assert!(status_res.is_ok(), "Status check should succeed");
    if let CliOutput::Status(ref active_tasks) = status_res.unwrap() {
        assert_eq!(active_tasks.len(), 1);
    } else {
        panic!("Expected CliOutput::Status");
    }

    assert!(stop_res.is_ok(), "Timer stop should succeed");
    assert!(engine.get_active_logs().unwrap().is_empty());

    assert!(done_res.is_ok(), "Task done should succeed");
    let subtask_in_db = persistence
        .tasks
        .get(&active_after_switch[0])
        .unwrap()
        .unwrap();
    assert!(subtask_in_db.completed, "Subtask must be marked completed");
}

#[test]
fn test_given_idle_timer_when_stop_invoked_then_fails_with_no_active_timer_exit_code_5() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_cli_stop_idle");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let stop_args = CliArgs::try_parse_from(["oxy", "stop"]).unwrap();

    // When
    let result = handle_cli(stop_args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 5);
    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "ENG_TIMER_INACTIVE");
}
