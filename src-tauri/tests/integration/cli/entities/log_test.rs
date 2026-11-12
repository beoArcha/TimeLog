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

fn setup_twenty_five_logs_fixture(
    test_name: &str,
) -> (
    Persistence,
    rusqlite::Connection,
    crate::shared::test_db::TempCsvDir,
) {
    let (conn, config, temp) = setup_persistence_test(test_name);
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

    (persistence, conn, temp)
}

#[test]
fn test_given_twenty_five_logs_when_log_ls_machine_mode_then_returns_all_untruncated() {
    // Given
    let (persistence, _conn, _temp) =
        setup_twenty_five_logs_fixture("test_log_untruncated_machine");
    let engine = Engine::new(&persistence);
    let machine_args = CliArgs::try_parse_from(["oxy", "log", "ls", "--json"]).unwrap();

    // When
    let machine_res = handle_cli(machine_args, &persistence, &engine).unwrap();

    // Then
    let machine_json: Vec<serde_json::Value> =
        serde_json::from_str(&machine_res.to_string()).expect("valid JSON array");
    assert_eq!(machine_json.len(), 25);
}

#[test]
fn test_given_twenty_five_logs_when_log_ls_machine_mode_with_limit_then_returns_exact_count() {
    // Given
    let (persistence, _conn, _temp) = setup_twenty_five_logs_fixture("test_log_machine_limit");
    let engine = Engine::new(&persistence);
    let machine_limit_args =
        CliArgs::try_parse_from(["oxy", "log", "ls", "--json", "--limit", "5"]).unwrap();

    // When
    let machine_limit_res = handle_cli(machine_limit_args, &persistence, &engine).unwrap();

    // Then
    let machine_limit_json: Vec<serde_json::Value> =
        serde_json::from_str(&machine_limit_res.to_string()).expect("valid JSON array");
    assert_eq!(machine_limit_json.len(), 5);
}

#[test]
fn test_given_twenty_five_logs_when_log_ls_human_mode_then_shows_twenty_rows_and_footer() {
    // Given
    let (persistence, _conn, _temp) = setup_twenty_five_logs_fixture("test_log_human_footer");
    let engine = Engine::new(&persistence);
    let human_args = CliArgs::try_parse_from(["oxy", "log", "ls"]).unwrap();

    // When
    let human_res = handle_cli(human_args, &persistence, &engine).unwrap();

    // Then
    let human_out = human_res.to_string();
    let row_count = human_out
        .lines()
        .filter(|l| l.contains("Limit Task"))
        .count();
    assert_eq!(row_count, 20);
    assert!(human_out.contains("… 5 more entries not shown. Use --limit <n> to show more."));
}

#[test]
fn test_given_twenty_five_logs_when_log_ls_quiet_mode_then_shows_twenty_rows_without_footer() {
    // Given
    let (persistence, _conn, _temp) = setup_twenty_five_logs_fixture("test_log_quiet_no_footer");
    let engine = Engine::new(&persistence);
    let quiet_args = CliArgs::try_parse_from(["oxy", "log", "ls", "-q"]).unwrap();

    // When
    let quiet_res = handle_cli(quiet_args, &persistence, &engine).unwrap();

    // Then
    let quiet_out = quiet_res.to_string();
    let row_count = quiet_out
        .lines()
        .filter(|l| l.contains("Limit Task"))
        .count();
    assert_eq!(row_count, 20);
    assert!(!quiet_out.contains("more entries not shown"));
}

#[test]
fn test_given_zero_limit_when_parsing_cli_args_then_fails_with_syntax_exit_code_two() {
    // Given
    let zero_limit_args = ["oxy", "log", "ls", "--limit", "0"];

    // When
    let zero_limit_parse = CliArgs::try_parse_from(zero_limit_args);

    // Then
    assert!(zero_limit_parse.is_err());
    assert_eq!(zero_limit_parse.unwrap_err().exit_code(), 2);
}

#[test]
fn test_given_existing_log_when_log_rm_invoked_with_yes_flag_then_deletes_log_without_prompting() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_log_rm_yes");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-log-rm-yes")
        .with_name("Confirm Removal Project")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-log-rm-yes")
        .with_project_id("p-log-rm-yes")
        .with_name("Removal Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let log = oxyflow_timelog::types::NewTimeLog {
        id: "l-rm-yes-01".to_string(),
        task_id: "t-log-rm-yes".to_string(),
        start_time: "2026-10-24T10:00:00Z".to_string(),
        end_time: Some("2026-10-24T10:45:00Z".to_string()),
        note: Some("Testing rm yes".to_string()),
    };
    persistence.time_logs.insert_full(&log).unwrap();

    let rm_args = CliArgs::try_parse_from(["oxy", "log", "rm", "l-rm-yes-01", "--yes"]).unwrap();

    // When
    let result = handle_cli(rm_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let output_str = format!("{}", result.unwrap());
    assert!(output_str.contains("Deleted time log: l-rm-yes-01"));
    assert!(persistence.time_logs.get_by_id("l-rm-yes-01").is_err());
}

#[test]
fn test_given_existing_log_when_log_rm_invoked_in_machine_mode_then_returns_removed_entry_in_envelope(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_log_rm_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-log-rm-mach")
        .with_name("Machine Removal Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-log-rm-mach")
        .with_project_id("p-log-rm-mach")
        .with_name("Machine Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let log = oxyflow_timelog::types::NewTimeLog {
        id: "l-rm-mach-01".to_string(),
        task_id: "t-log-rm-mach".to_string(),
        start_time: "2026-10-24T10:00:00Z".to_string(),
        end_time: Some("2026-10-24T10:45:00Z".to_string()),
        note: Some("Machine note".to_string()),
    };
    persistence.time_logs.insert_full(&log).unwrap();

    let rm_args = CliArgs::try_parse_from(["oxy", "--json", "log", "rm", "l-rm-mach-01"]).unwrap();

    // When
    let result = handle_cli(rm_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let parsed: serde_json::Value =
        serde_json::from_str(&format!("{}", result.unwrap())).expect("valid json envelope");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["action"], "removed");
    assert_eq!(parsed["id"], "l-rm-mach-01");
    assert_eq!(parsed["entry"]["id"], "l-rm-mach-01");
    assert_eq!(parsed["entry"]["taskId"], "t-log-rm-mach");
    assert_eq!(parsed["entry"]["startTime"], "2026-10-24T10:00:00Z");
    assert_eq!(parsed["entry"]["endTime"], "2026-10-24T10:45:00Z");
    assert_eq!(parsed["entry"]["note"], "Machine note");
    assert!(persistence.time_logs.get_by_id("l-rm-mach-01").is_err());
}

#[test]
fn test_given_compiled_oxy_binary_when_log_rm_executed_with_non_tty_stdin_then_deletes_without_hanging(
) {
    use std::process::{Command, Stdio};
    use std::time::{Duration, Instant};

    // Given
    let oxy_bin = env!("CARGO_BIN_EXE_oxy");
    let temp_dir =
        std::env::temp_dir().join(format!("timelog_oxy_rm_test_{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(&temp_dir).expect("create temp dir");
    let db_path = temp_dir.join("test_rm.db");
    let db_path_str = db_path.to_str().unwrap();

    {
        let conn = rusqlite::Connection::open(&db_path).expect("open db");
        oxyflow_timelog::repositories::shared::initialize_database(&conn).expect("init db");
        conn.execute(
            "INSERT INTO projects (id, name, color, created_at, archived) VALUES ('p-sub', 'Sub Project', '#fff', '2026-01-01T00:00:00Z', 0)",
            [],
        )
        .expect("insert proj");
        conn.execute(
            "INSERT INTO tasks (id, project_id, name, created_at, completed) VALUES ('t-sub', 'p-sub', 'Sub Task', '2026-01-01T00:00:00Z', 0)",
            [],
        )
        .expect("insert task");
        conn.execute(
            "INSERT INTO time_logs (id, task_id, start_time, end_time, note) VALUES ('log-sub-01', 't-sub', '2026-10-24T10:00:00Z', '2026-10-24T10:45:00Z', 'Sub test')",
            [],
        )
        .expect("insert log");
    }

    // When: run with non-TTY stdin (Stdio::null())
    let mut cmd = Command::new(oxy_bin);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd.args(["--db", db_path_str, "log", "rm", "log-sub-01"])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = cmd.spawn().expect("failed to spawn oxy binary");
    let timeout = Duration::from_secs(10);
    let start = Instant::now();

    let output = loop {
        match child.try_wait().expect("failed to check child status") {
            Some(_status) => {
                break child
                    .wait_with_output()
                    .expect("failed to wait child output");
            }
            None => {
                if start.elapsed() > timeout {
                    let _ = child.kill();
                    panic!("oxy process timed out after {:?}", timeout);
                }
                std::thread::sleep(Duration::from_millis(50));
            }
        }
    };

    // Then
    assert_eq!(output.status.code(), Some(0));
    let stdout_str = String::from_utf8_lossy(&output.stdout);
    assert!(stdout_str.contains("Deleted time log: log-sub-01"));

    let conn = rusqlite::Connection::open(&db_path).expect("open db verification");
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM time_logs WHERE id = 'log-sub-01'",
            [],
            |row| row.get(0),
        )
        .expect("query count");
    assert_eq!(count, 0);

    let _ = std::fs::remove_dir_all(&temp_dir);
}
