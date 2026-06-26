use crate::shared::test_db::setup_persistence_test;
use oxy_flow::cli::manage::project::ProjectCommand;
use oxy_flow::cli::manage::task::TaskCommand;
use oxy_flow::cli::manage::ManageCommand;
use oxy_flow::cli::shared::parser::CliCommands;
use oxy_flow::cli::timer::TimerCommand;
use oxy_flow::cli::{handle_cli, CliArgs, CliOutput};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::PersistenceLayer;
use rusqlite::Connection;

fn setup(
    db_name: &str,
) -> (
    PersistenceLayer,
    Connection,
    crate::shared::test_db::TempCsvDir,
) {
    let (conn, config, temp_dir) = setup_persistence_test(db_name);
    let persistence = PersistenceLayer::new(&config).expect("failed to create persistence layer");

    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO projects (id, name, color, created_at) VALUES ('p1', 'CliProj', 'blue', ?)",
        [&now],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t1', 'p1', 'CliTask', ?)",
        [&now],
    )
    .unwrap();

    (persistence, conn, temp_dir)
}

#[test]
fn test_cli_start_returns_started_output() {
    let (persistence, _conn, _temp) = setup("test_cli_start_returns_started_output");
    let engine = Engine::new(&persistence);
    let result = handle_cli(
        CliArgs {
            command: CliCommands::Timer(TimerCommand::Start {
                task_id: "t1".to_string(),
            }),
        },
        &persistence,
        &engine,
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
    let (persistence, _conn, _temp) = setup("test_cli_status_returns_active_tasks");
    let engine = Engine::new(&persistence);
    engine.start_timer("t1").expect("start failed");

    let result = handle_cli(
        CliArgs {
            command: CliCommands::Timer(TimerCommand::Status),
        },
        &persistence,
        &engine,
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
    let (persistence, _conn, _temp) = setup("test_cli_status_empty_when_no_timer_running");
    let engine = Engine::new(&persistence);
    let result = handle_cli(
        CliArgs {
            command: CliCommands::Timer(TimerCommand::Status),
        },
        &persistence,
        &engine,
    );
    assert!(result.is_ok());
    match result.unwrap() {
        CliOutput::Status(active) => assert_eq!(active.len(), 0),
        other => panic!("Expected Status, got {}", other),
    }
}

#[test]
fn test_cli_stop_returns_stopped_output() {
    let (persistence, _conn, _temp) = setup("test_cli_stop_returns_stopped_output");
    let engine = Engine::new(&persistence);
    engine.start_timer("t1").expect("start failed");

    let result = handle_cli(
        CliArgs {
            command: CliCommands::Timer(TimerCommand::Stop),
        },
        &persistence,
        &engine,
    );
    assert!(result.is_ok());
    assert!(matches!(result.unwrap(), CliOutput::Stopped));

    let active = engine.get_active_logs().expect("query failed");
    assert_eq!(active.len(), 0);
}

#[test]
fn test_cli_stop_when_nothing_running_is_ok() {
    let (persistence, _conn, _temp) = setup("test_cli_stop_when_nothing_running_is_ok");
    let engine = Engine::new(&persistence);
    let result = handle_cli(
        CliArgs {
            command: CliCommands::Timer(TimerCommand::Stop),
        },
        &persistence,
        &engine,
    );
    assert!(
        result.is_ok(),
        "Stop with no running timer should not error"
    );
}

#[test]
fn test_cli_nonexistent_task_fails() {
    let (persistence, _conn, _temp) = setup("test_cli_nonexistent_task_fails");
    let engine = Engine::new(&persistence);
    let result = handle_cli(
        CliArgs {
            command: CliCommands::Timer(TimerCommand::Start {
                task_id: "nonexistent".to_string(),
            }),
        },
        &persistence,
        &engine,
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

#[test]
fn test_cli_manage_project_create() {
    let (persistence, _conn, _temp) = setup("test_cli_manage_project_create");
    let engine = Engine::new(&persistence);
    let result = handle_cli(
        CliArgs {
            command: CliCommands::Manage(ManageCommand::Project(ProjectCommand::Create {
                name: "NewProj".into(),
                color: Some("red".into()),
            })),
        },
        &persistence,
        &engine,
    );
    assert!(result.is_ok());
    if let CliOutput::Success(msg) = result.unwrap() {
        assert!(msg.contains("Created project"));
    } else {
        panic!("Expected Success output");
    }
}

#[test]
fn test_cli_manage_task_create() {
    let (persistence, _conn, _temp) = setup("test_cli_manage_task_create");
    let engine = Engine::new(&persistence);
    let result = handle_cli(
        CliArgs {
            command: CliCommands::Manage(ManageCommand::Task(TaskCommand::Create {
                project_id: "p1".into(),
                name: "NewTask".into(),
            })),
        },
        &persistence,
        &engine,
    );
    assert!(result.is_ok());
    if let CliOutput::Success(msg) = result.unwrap() {
        assert!(msg.contains("Created task"));
    } else {
        panic!("Expected Success output");
    }
}
