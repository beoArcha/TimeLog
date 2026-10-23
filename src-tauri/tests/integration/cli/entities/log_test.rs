use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::{handle_cli, CliArgs};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_target_task_when_log_add_invoked_then_creates_retroactive_entry_with_duration() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_log_add");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-log-01")
        .with_name("Time Tracking")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-log-01")
        .with_project_id("p-log-01")
        .with_name("Consulting Call")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let args = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Consulting Call",
        "1h30m",
        "Q3 Strategy alignment",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let logs = persistence.time_logs.get_for_task("t-log-01").unwrap();
    assert_eq!(logs.len(), 1);
    assert_eq!(logs[0].note.as_deref(), Some("Q3 Strategy alignment"));
}

#[test]
fn test_given_existing_logs_when_log_list_invoked_then_displays_logged_time_entries() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_log_ls");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-log-02")
        .with_name("Audit Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-log-02")
        .with_project_id("p-log-02")
        .with_name("Quarterly Review")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let add_args = CliArgs::try_parse_from([
        "oxy",
        "l",
        "add",
        "Quarterly Review",
        "45m",
        "Reviewed metrics",
    ])
    .unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();

    let list_args = CliArgs::try_parse_from(["oxy", "l", "ls"]).unwrap();

    // When
    let result = handle_cli(list_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let output_str = format!("{}", result.unwrap());
    assert!(output_str.contains("Quarterly Review"));
    assert!(output_str.contains("Reviewed metrics"));
}

#[test]
fn test_given_non_existent_log_id_when_log_rm_invoked_then_returns_entity_not_found_exit_code_4() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_log_rm_not_found");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let rm_args = CliArgs::try_parse_from(["oxy", "log", "rm", "non-existent-log-999"]).unwrap();

    // When
    let result = handle_cli(rm_args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 4);
    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "DOM_ENTITY_NOT_FOUND");
    assert!(envelope
        .technical
        .contains("Time log 'non-existent-log-999' not found"));
}
