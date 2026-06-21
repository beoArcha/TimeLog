use crate::shared::test_db::TestDb;
use oxy_flow::cli::{handle_cli, CliArgs, CliCommands, CliOutput};
use oxy_flow::services::timer_service;
use rusqlite::Connection;

fn setup() -> Connection {
    TestDb::new()
        .with_project("p1", "CliProj", "blue")
        .with_task("t1", "p1", "CliTask")
        .conn
}

#[test]
fn test_cli_start_returns_started_output() {
    let conn = setup();
    let result = handle_cli(
        CliArgs {
            command: CliCommands::Start {
                task_id: "t1".to_string(),
            },
        },
        &conn,
    );
    assert!(result.is_ok(), "start should succeed");
    let output = result.unwrap();
    assert!(
        matches!(output, CliOutput::Started(ref id) if id == "t1"),
        "should return Started with task id"
    );
}

#[test]
fn test_cli_start_output_displays_correctly() {
    let output = CliOutput::Started("t1".to_string());
    let text = format!("{}", output);
    assert!(text.contains("t1"));
    assert!(text.contains("▶️"));
}

#[test]
fn test_cli_status_returns_active_tasks() {
    let conn = setup();
    timer_service::start(&conn, "t1").expect("start failed");

    let result = handle_cli(
        CliArgs {
            command: CliCommands::Status,
        },
        &conn,
    );
    assert!(result.is_ok());
    match result.unwrap() {
        CliOutput::Status(active) => {
            assert_eq!(active.len(), 1);
            assert_eq!(active[0], "t1");
        }
        other => panic!("Expected Status, got {}", other),
    }
}

#[test]
fn test_cli_status_empty_when_no_timer_running() {
    let conn = setup();
    let result = handle_cli(
        CliArgs {
            command: CliCommands::Status,
        },
        &conn,
    );
    assert!(result.is_ok());
    match result.unwrap() {
        CliOutput::Status(active) => assert_eq!(active.len(), 0),
        other => panic!("Expected Status, got {}", other),
    }
}

#[test]
fn test_cli_stop_returns_stopped_output() {
    let conn = setup();
    timer_service::start(&conn, "t1").expect("start failed");

    let result = handle_cli(
        CliArgs {
            command: CliCommands::Stop,
        },
        &conn,
    );
    assert!(result.is_ok());
    assert!(matches!(result.unwrap(), CliOutput::Stopped));

    let active = timer_service::get_active(&conn).expect("query failed");
    assert_eq!(active.len(), 0);
}

#[test]
fn test_cli_stop_when_nothing_running_is_ok() {
    let conn = setup();
    let result = handle_cli(
        CliArgs {
            command: CliCommands::Stop,
        },
        &conn,
    );
    assert!(
        result.is_ok(),
        "Stop with no running timer should not error"
    );
}

#[test]
fn test_cli_nonexistent_task_fails() {
    let conn = setup();
    let result = handle_cli(
        CliArgs {
            command: CliCommands::Start {
                task_id: "nonexistent".to_string(),
            },
        },
        &conn,
    );
    assert!(result.is_err(), "Starting nonexistent task should fail");
}

#[test]
fn test_cli_output_stopped_displays_correctly() {
    let text = format!("{}", CliOutput::Stopped);
    assert!(text.contains("⏹️"));
}

#[test]
fn test_cli_output_status_displays_correctly() {
    let output = CliOutput::Status(vec!["t1".to_string(), "t2".to_string()]);
    let text = format!("{}", output);
    assert!(text.contains("2"));
    assert!(text.contains("t1"));
    assert!(text.contains("t2"));
}
