use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;

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
fn test_given_twenty_five_logs_when_log_ls_invoked_then_machine_mode_is_untruncated_and_human_shows_footer(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_untruncated_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-limit")
        .with_name("Limit Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-limit")
        .with_project_id("p-limit")
        .with_name("Limit Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    for i in 1..=25 {
        let note = format!("Log entry {}", i);
        let add_args =
            CliArgs::try_parse_from(["oxy", "log", "add", "Limit Task", "10m", &note]).unwrap();
        handle_cli(add_args, &persistence, &engine).unwrap();
    }

    // When
    let machine_args = CliArgs::try_parse_from(["oxy", "log", "ls", "--json"]).unwrap();
    let machine_res = handle_cli(machine_args, &persistence, &engine).unwrap();

    // Then
    let machine_json: Vec<serde_json::Value> =
        serde_json::from_str(&machine_res.to_string()).expect("valid JSON array");
    assert_eq!(machine_json.len(), 25);

    // When
    let machine_limit_args =
        CliArgs::try_parse_from(["oxy", "log", "ls", "--json", "--limit", "5"]).unwrap();
    let machine_limit_res = handle_cli(machine_limit_args, &persistence, &engine).unwrap();

    // Then
    let machine_limit_json: Vec<serde_json::Value> =
        serde_json::from_str(&machine_limit_res.to_string()).expect("valid JSON array");
    assert_eq!(machine_limit_json.len(), 5);

    // When
    let human_args = CliArgs::try_parse_from(["oxy", "log", "ls"]).unwrap();
    let human_res = handle_cli(human_args, &persistence, &engine).unwrap();

    // Then
    let human_out = human_res.to_string();
    let row_count = human_out
        .lines()
        .filter(|l| l.contains("Limit Task"))
        .count();
    assert_eq!(row_count, 20);
    assert!(human_out.contains("… 5 more entries not shown. Use --limit <n> to show more."));

    // When
    let zero_limit_parse = CliArgs::try_parse_from(["oxy", "log", "ls", "--limit", "0"]);

    // Then
    assert!(zero_limit_parse.is_err());
    assert_eq!(zero_limit_parse.unwrap_err().exit_code(), 2);
}
