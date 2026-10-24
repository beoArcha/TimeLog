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

#[test]
fn test_given_configured_persistence_when_adding_log_in_machine_mode_then_returns_json_envelope() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_log_add_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-log-mach")
        .with_name("Mach Log Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-log-mach")
        .with_project_id("p-log-mach")
        .with_name("Log Target Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let args = CliArgs::try_parse_from([
        "oxy",
        "--json",
        "log",
        "add",
        "Log Target Task",
        "30m",
        "Backend dev",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["action"], "created");
    assert!(parsed["id"].is_string());
}

#[test]
fn test_given_existing_logs_when_listing_in_machine_mode_then_returns_clean_json_array() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_log_ls_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-log-ls")
        .with_name("Log List Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-log-ls")
        .with_project_id("p-log-ls")
        .with_name("Task For Log Listing")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let add_args = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Task For Log Listing",
        "15m",
        "Note for listing",
    ])
    .unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();

    let list_args = CliArgs::try_parse_from(["oxy", "--machine", "log", "ls"]).unwrap();

    // When
    let result = handle_cli(list_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON array");
    assert!(parsed.is_array());
    assert_eq!(parsed[0]["note"], "Note for listing");
}

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
    ])
    .unwrap();

    // When
    let result = handle_cli(edit_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["action"], "updated");
    assert_eq!(parsed["id"], log_id.as_str());
}

#[test]
fn test_given_existing_log_when_removing_in_machine_mode_then_returns_json_envelope() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_log_rm_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-log-rm")
        .with_name("Log Rm Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-log-rm")
        .with_project_id("p-log-rm")
        .with_name("Task For Log Removal")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let add_args = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Task For Log Removal",
        "25m",
        "To be deleted",
    ])
    .unwrap();
    handle_cli(add_args, &persistence, &engine).unwrap();
    let logs = persistence.time_logs.get_all().unwrap();
    let log_id = &logs[0].id;

    let rm_args = CliArgs::try_parse_from(["oxy", "--machine", "log", "rm", log_id]).unwrap();

    // When
    let result = handle_cli(rm_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["action"], "removed");
    assert_eq!(parsed["id"], log_id.as_str());
}

#[test]
fn test_given_explicit_from_to_when_log_add_invoked_then_creates_log_with_exact_timestamps() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_explicit_timestamps");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-log-ts")
        .with_name("Timestamp Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-log-ts")
        .with_project_id("p-log-ts")
        .with_name("Timestamp Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let args = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Timestamp Task",
        "--from",
        "2026-10-24T10:00:00Z",
        "--to",
        "2026-10-24T11:30:00Z",
        "--note",
        "Exact duration 1.5h",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let logs = persistence.time_logs.get_for_task("t-log-ts").unwrap();
    assert_eq!(logs.len(), 1);
    assert_eq!(logs[0].start_time, "2026-10-24T10:00:00+00:00");
    assert_eq!(
        logs[0].end_time.as_deref(),
        Some("2026-10-24T11:30:00+00:00")
    );
    assert_eq!(logs[0].note.as_deref(), Some("Exact duration 1.5h"));
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
fn test_given_logs_across_projects_when_listing_with_project_filter_then_returns_matching_project_logs(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_project_filter");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj1 = ProjectBuilder::new()
        .with_id("p-alpha")
        .with_name("Alpha Project")
        .build();
    let proj2 = ProjectBuilder::new()
        .with_id("p-beta")
        .with_name("Beta Project")
        .build();
    let task1 = TaskBuilder::new()
        .with_id("t-alpha-1")
        .with_project_id("p-alpha")
        .with_name("Alpha Task")
        .build();
    let task2 = TaskBuilder::new()
        .with_id("t-beta-1")
        .with_project_id("p-beta")
        .with_name("Beta Task")
        .build();

    persistence.projects.create(proj1).unwrap();
    persistence.projects.create(proj2).unwrap();
    persistence.tasks.create(task1).unwrap();
    persistence.tasks.create(task2).unwrap();

    let add1 =
        CliArgs::try_parse_from(["oxy", "log", "add", "Alpha Task", "20m", "Alpha work"]).unwrap();
    let add2 =
        CliArgs::try_parse_from(["oxy", "log", "add", "Beta Task", "40m", "Beta work"]).unwrap();
    handle_cli(add1, &persistence, &engine).unwrap();
    handle_cli(add2, &persistence, &engine).unwrap();

    let list_args =
        CliArgs::try_parse_from(["oxy", "--json", "log", "ls", "-p", "Alpha Project"]).unwrap();

    // When
    let result = handle_cli(list_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    let parsed: Vec<serde_json::Value> = serde_json::from_str(&rendered).expect("valid JSON array");
    assert_eq!(parsed.len(), 1);
    assert_eq!(parsed[0]["taskId"], "t-alpha-1");
    assert_eq!(parsed[0]["note"], "Alpha work");
}

#[test]
fn test_given_logs_across_dates_when_listing_with_from_to_filter_then_returns_logs_in_range() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_date_range_filter");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-range")
        .with_name("Range Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-range")
        .with_project_id("p-range")
        .with_name("Range Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    // Log 1: Early October (outside)
    let add1 = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Range Task",
        "--from",
        "2026-10-02T10:00:00Z",
        "--to",
        "2026-10-02T11:00:00Z",
        "--note",
        "Early",
    ])
    .unwrap();
    // Log 2: Mid October (inside)
    let add2 = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Range Task",
        "--from",
        "2026-10-15T10:00:00Z",
        "--to",
        "2026-10-15T11:00:00Z",
        "--note",
        "Mid",
    ])
    .unwrap();
    // Log 3: Late October (outside)
    let add3 = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Range Task",
        "--from",
        "2026-10-28T10:00:00Z",
        "--to",
        "2026-10-28T11:00:00Z",
        "--note",
        "Late",
    ])
    .unwrap();

    handle_cli(add1, &persistence, &engine).unwrap();
    handle_cli(add2, &persistence, &engine).unwrap();
    handle_cli(add3, &persistence, &engine).unwrap();

    let filter_args = CliArgs::try_parse_from([
        "oxy",
        "--json",
        "log",
        "ls",
        "--from",
        "2026-10-10",
        "--to",
        "2026-10-20",
    ])
    .unwrap();

    // When
    let result = handle_cli(filter_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    let parsed: Vec<serde_json::Value> = serde_json::from_str(&rendered).expect("valid JSON array");
    assert_eq!(parsed.len(), 1);
    assert_eq!(parsed[0]["note"], "Mid");
}

#[test]
fn test_given_logs_when_listing_with_month_flag_then_returns_current_month_entries() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_month_filter");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-month")
        .with_name("Month Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-month")
        .with_project_id("p-month")
        .with_name("Month Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let add_current =
        CliArgs::try_parse_from(["oxy", "log", "add", "Month Task", "30m", "Current entry"])
            .unwrap();
    let add_past = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Month Task",
        "--from",
        "2025-01-10T10:00:00Z",
        "--to",
        "2025-01-10T11:00:00Z",
        "--note",
        "Past entry",
    ])
    .unwrap();

    handle_cli(add_current, &persistence, &engine).unwrap();
    handle_cli(add_past, &persistence, &engine).unwrap();

    let list_args = CliArgs::try_parse_from(["oxy", "--json", "log", "ls", "--month"]).unwrap();

    // When
    let result = handle_cli(list_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    let parsed: Vec<serde_json::Value> = serde_json::from_str(&rendered).expect("valid JSON array");
    assert_eq!(parsed.len(), 1);
    assert_eq!(parsed[0]["note"], "Current entry");
}

#[test]
fn test_given_start_after_end_when_log_add_invoked_then_fails_validation() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_invalid_bounds");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-inv")
        .with_name("Invalid Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-inv")
        .with_project_id("p-inv")
        .with_name("Invalid Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let args = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Invalid Task",
        "--from",
        "2026-10-24T12:00:00Z",
        "--to",
        "2026-10-24T10:00:00Z",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 1);
}

#[test]
fn test_given_no_edit_fields_when_log_edit_invoked_then_returns_syntax_error() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_empty_edit");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let args = CliArgs::try_parse_from(["oxy", "log", "edit", "log-any-id"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 2);
}
