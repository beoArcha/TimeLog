use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;

#[test]
fn test_given_existing_log_when_editing_in_machine_mode_then_returns_json_envelope() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_log_edit_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-log-edit")
        .with_name("Log Edit Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-log-edit")
        .with_project_id("p-log-edit")
        .with_name("Task For Log Editing")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let add_args = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Task For Log Editing",
        "20m",
        "Original note",
    ])
    .unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();
    let logs = persistence.time_logs.get_all().unwrap();
    let log_id = &logs[0].id;

    let edit_args = CliArgs::try_parse_from([
        "oxy",
        "--machine",
        "log",
        "edit",
        log_id,
        "--note",
        "Updated machine note",
        "--reason",
        "Corrected note via machine CLI",
    ])
    .unwrap();

    // When
    let result = handle_cli(edit_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    assert_eq!(parsed["schema"], "oxy.log.edit");
    assert_eq!(parsed["schemaVersion"], 1);
    assert_eq!(parsed["data"]["id"], log_id.as_str());
    assert_eq!(parsed["data"]["note"], "Updated machine note");
}

#[test]
fn test_given_log_when_edited_with_new_task_and_start_time_then_persists_reassigned_entry() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_edit_reassign");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-log-reassign")
        .with_name("Reassign Proj")
        .build();
    let task1 = TaskBuilder::new()
        .with_id("t-log-orig")
        .with_project_id("p-log-reassign")
        .with_name("Original Task")
        .build();
    let task2 = TaskBuilder::new()
        .with_id("t-log-dest")
        .with_project_id("p-log-reassign")
        .with_name("Destination Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task1).unwrap();
    persistence.tasks.create(task2).unwrap();

    let add_args =
        CliArgs::try_parse_from(["oxy", "log", "add", "Original Task", "30m", "Initial entry"])
            .unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();
    let logs = persistence.time_logs.get_for_task("t-log-orig").unwrap();
    let log_id = logs[0].id.clone();

    let edit_args = CliArgs::try_parse_from([
        "oxy",
        "log",
        "edit",
        &log_id,
        "--task",
        "Destination Task",
        "--start",
        "2026-10-24T08:00:00Z",
        "--note",
        "Reassigned and shifted",
        "--reason",
        "Task reassignment and start shift",
    ])
    .unwrap();

    // When
    let result = handle_cli(edit_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let orig_logs = persistence.time_logs.get_for_task("t-log-orig").unwrap();
    assert_eq!(orig_logs.len(), 0);

    let dest_logs = persistence.time_logs.get_for_task("t-log-dest").unwrap();
    assert_eq!(dest_logs.len(), 1);
    assert_eq!(dest_logs[0].id, log_id);
    assert_eq!(dest_logs[0].start_time, "2026-10-24T08:00:00+00:00");
    assert_eq!(dest_logs[0].note.as_deref(), Some("Reassigned and shifted"));
}

#[test]
fn test_given_no_edit_fields_when_log_edit_invoked_then_returns_syntax_error() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_empty_edit");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let args = CliArgs::try_parse_from([
        "oxy",
        "log",
        "edit",
        "log-any-id",
        "--reason",
        "Valid reason without fields",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 2);
}

#[test]
fn test_given_log_edit_without_reason_then_fails_validation_with_nonzero_exit_code() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_edit_no_reason");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-no-reason")
        .with_name("No Reason Project")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-no-reason")
        .with_project_id("p-no-reason")
        .with_name("No Reason Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let add_args = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "No Reason Task",
        "30m",
        "Original work",
    ])
    .unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();
    let logs = persistence.time_logs.get_all().unwrap();
    let log_id = &logs[0].id;

    let edit_args =
        CliArgs::try_parse_from(["oxy", "log", "edit", log_id, "--note", "Updated note"]).unwrap();

    // When
    let result = handle_cli(edit_args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_ne!(err.exit_code(), 0);
    let msg = format!("{}", err);
    assert!(
        msg.contains("--reason") || msg.contains("reason"),
        "Error message should mention required --reason flag, got: {}",
        msg
    );
}

#[test]
fn test_given_log_edit_with_empty_or_whitespace_reason_then_fails_validation() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_edit_whitespace_reason");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-ws-reason")
        .with_name("Whitespace Project")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-ws-reason")
        .with_project_id("p-ws-reason")
        .with_name("Whitespace Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let add_args = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Whitespace Task",
        "15m",
        "Initial task note",
    ])
    .unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();
    let logs = persistence.time_logs.get_all().unwrap();
    let log_id = &logs[0].id;

    // Test empty string
    let edit_empty = CliArgs::try_parse_from([
        "oxy", "log", "edit", log_id, "--note", "New Note", "--reason", "",
    ])
    .unwrap();
    let result_empty = handle_cli(edit_empty, &persistence, &engine);
    assert!(result_empty.is_err());
    assert_ne!(result_empty.unwrap_err().exit_code(), 0);

    // Test whitespace string
    let edit_ws = CliArgs::try_parse_from([
        "oxy",
        "log",
        "edit",
        log_id,
        "--duration",
        "25m",
        "-r",
        "   \t  ",
    ])
    .unwrap();
    let result_ws = handle_cli(edit_ws, &persistence, &engine);
    assert!(result_ws.is_err());
    assert_ne!(result_ws.unwrap_err().exit_code(), 0);
}

#[test]
fn test_given_log_edit_with_valid_reason_then_creates_history_entry_with_cli_edit_and_trimmed_reason(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_edit_valid_reason");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-valid-edit")
        .with_name("Audit Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-valid-edit")
        .with_project_id("p-valid-edit")
        .with_name("Audit Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let add_args =
        CliArgs::try_parse_from(["oxy", "log", "add", "Audit Task", "10m", "Initial note"])
            .unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();
    let logs = persistence.time_logs.get_all().unwrap();
    let log_id = &logs[0].id;

    let edit_args = CliArgs::try_parse_from([
        "oxy",
        "log",
        "edit",
        log_id,
        "--note",
        "Updated audit note",
        "--reason",
        "   Meeting notes were revised   ",
    ])
    .unwrap();

    // When
    let result = handle_cli(edit_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let updated = persistence.time_logs.get_by_id(log_id).unwrap();
    assert_eq!(updated.note.as_deref(), Some("Updated audit note"));

    let history = updated.edit_history.expect("edit_history must be recorded");
    assert_eq!(history.len(), 1);
    assert_eq!(history[0].audit_source.as_deref(), Some("CLI Edit"));
    assert_eq!(
        history[0].reason.as_deref(),
        Some("Meeting notes were revised")
    );
    assert_eq!(history[0].prev_note.as_deref(), Some("Initial note"));
}

#[test]
fn test_given_log_edit_with_short_reason_flag_then_succeeds_and_creates_history_entry() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_edit_short_flag");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-short-flag")
        .with_name("Short Flag Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-short-flag")
        .with_project_id("p-short-flag")
        .with_name("Short Flag Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let add_args =
        CliArgs::try_parse_from(["oxy", "log", "add", "Short Flag Task", "20m", "Work"]).unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();
    let logs = persistence.time_logs.get_all().unwrap();
    let log_id = &logs[0].id;

    let edit_args = CliArgs::try_parse_from([
        "oxy",
        "log",
        "edit",
        log_id,
        "--duration",
        "35m",
        "-r",
        "Extended work session",
    ])
    .unwrap();

    // When
    let result = handle_cli(edit_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let updated = persistence.time_logs.get_by_id(log_id).unwrap();
    let history = updated.edit_history.expect("edit_history must be recorded");
    assert_eq!(history.len(), 1);
    assert_eq!(history[0].audit_source.as_deref(), Some("CLI Edit"));
    assert_eq!(history[0].reason.as_deref(), Some("Extended work session"));
}
