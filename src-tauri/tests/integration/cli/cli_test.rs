use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::cli::manage::project::ProjectCommand;
use oxy_flow::cli::manage::subtask::SubtaskCommand;
use oxy_flow::cli::manage::task::TaskCommand;
use oxy_flow::cli::manage::ManageCommand;
use oxy_flow::cli::timer::TimerCommand;
use oxy_flow::cli::{handle_cli, CliArgs, CliCommand, CliOutput};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use rusqlite::Connection;

fn setup(db_name: &str) -> (Persistence, Connection, crate::shared::test_db::TempCsvDir) {
    let (conn, config, temp_dir) = setup_persistence_test(db_name);
    let persistence = Persistence::new(&config).expect("failed to create persistence layer");

    let project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("CliProj")
        .with_color("blue")
        .build();
    let task = TaskBuilder::new()
        .with_id("t1")
        .with_project_id("p1")
        .with_name("CliTask")
        .build();

    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();

    (persistence, conn, temp_dir)
}

#[test]
fn test_given_existing_task_when_timer_start_invoked_via_cli_then_returns_started_output() {
    // Given
    let (persistence, _conn, _temp) = setup("test_cli_start_returns_started_output");
    let engine = Engine::new(&persistence);
    let args = CliArgs {
        command: Some(CliCommand::Timer(TimerCommand::Start {
            task_id: "t1".to_string(),
        })),
        ..Default::default()
    };

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok(), "start should succeed");
    let output = result.unwrap();
    assert!(
        matches!(output, CliOutput::Started(ref id) if id == "t1"),
        "should return Started with task id"
    );
}

#[test]
fn test_given_started_output_when_formatted_as_display_then_contains_task_and_icon() {
    // Given
    let output = CliOutput::Started("t1".to_string());

    // When
    let text = format!("{}", output);

    // Then
    assert!(text.contains("t1"));
    assert!(text.contains("▶️"));
}

#[test]
fn test_given_running_timer_when_status_invoked_via_cli_then_returns_active_task_list() {
    // Given
    let (persistence, _conn, _temp) = setup("test_cli_status_returns_active_tasks");
    let engine = Engine::new(&persistence);
    engine.start_timer("t1").expect("start failed");
    let args = CliArgs {
        command: Some(CliCommand::Timer(TimerCommand::Status)),
        ..Default::default()
    };

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
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
fn test_given_idle_system_when_status_invoked_via_cli_then_returns_empty_active_list() {
    // Given
    let (persistence, _conn, _temp) = setup("test_cli_status_empty_when_no_timer_running");
    let engine = Engine::new(&persistence);
    let args = CliArgs {
        command: Some(CliCommand::Timer(TimerCommand::Status)),
        ..Default::default()
    };

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    match result.unwrap() {
        CliOutput::Status(active) => assert_eq!(active.len(), 0),
        other => panic!("Expected Status, got {}", other),
    }
}

#[test]
fn test_given_running_timer_when_stop_invoked_via_cli_then_returns_stopped_output_and_clears_active(
) {
    // Given
    let (persistence, _conn, _temp) = setup("test_cli_stop_returns_stopped_output");
    let engine = Engine::new(&persistence);
    engine.start_timer("t1").expect("start failed");
    let args = CliArgs {
        command: Some(CliCommand::Timer(TimerCommand::Stop)),
        ..Default::default()
    };

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    assert!(matches!(result.unwrap(), CliOutput::Stopped));

    let active = engine.get_active_logs().expect("query failed");
    assert_eq!(active.len(), 0);
}

#[test]
fn test_given_idle_system_when_stop_invoked_via_cli_then_succeeds_gracefully() {
    // Given
    let (persistence, _conn, _temp) = setup("test_cli_stop_when_nothing_running_is_ok");
    let engine = Engine::new(&persistence);
    let args = CliArgs {
        command: Some(CliCommand::Timer(TimerCommand::Stop)),
        ..Default::default()
    };

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(
        result.is_ok(),
        "Stop with no running timer should not error"
    );
}

#[test]
fn test_given_nonexistent_task_when_timer_start_invoked_via_cli_then_returns_error() {
    // Given
    let (persistence, _conn, _temp) = setup("test_cli_nonexistent_task_fails");
    let engine = Engine::new(&persistence);
    let args = CliArgs {
        command: Some(CliCommand::Timer(TimerCommand::Start {
            task_id: "nonexistent".to_string(),
        })),
        ..Default::default()
    };

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_err(), "Starting nonexistent task should fail");
}

#[test]
fn test_given_stopped_output_when_formatted_as_display_then_contains_stop_icon() {
    // Given
    let output = CliOutput::Stopped;

    // When
    let text = format!("{}", output);

    // Then
    assert!(text.contains("⏹️"));
}

#[test]
fn test_given_status_output_when_formatted_as_display_then_contains_count_and_task_ids() {
    // Given
    let output = CliOutput::Status(vec!["t1".to_string(), "t2".to_string()]);

    // When
    let text = format!("{}", output);

    // Then
    assert!(text.contains("2"));
    assert!(text.contains("t1"));
    assert!(text.contains("t2"));
}

#[test]
fn test_given_persistence_when_creating_project_via_cli_then_project_is_created() {
    // Given
    let (persistence, _conn, _temp) = setup("test_cli_manage_project_create");
    let engine = Engine::new(&persistence);
    let args = CliArgs {
        command: Some(CliCommand::Manage(ManageCommand::Project(
            ProjectCommand::Create {
                name: "NewProj".into(),
                color: Some("red".into()),
            },
        ))),
        ..Default::default()
    };

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    if let CliOutput::Success(msg) = result.unwrap() {
        assert!(msg.contains("Created project"));
    } else {
        panic!("Expected Success output");
    }
}

#[test]
fn test_given_existing_project_when_archiving_via_cli_then_archive_succeeds() {
    // Given
    let (persistence, _conn, _temp) = setup("test_cli_manage_project_archive");
    let engine = Engine::new(&persistence);
    let args = CliArgs {
        command: Some(CliCommand::Manage(ManageCommand::Project(
            ProjectCommand::Archive { id: "p1".into() },
        ))),
        ..Default::default()
    };

    // When
    let archive_res = handle_cli(args, &persistence, &engine);

    // Then
    assert!(archive_res.is_ok());
}

#[test]
fn test_given_existing_project_when_creating_task_via_cli_then_task_is_created() {
    // Given
    let (persistence, _conn, _temp) = setup("test_cli_manage_task_create");
    let engine = Engine::new(&persistence);
    let args = CliArgs {
        command: Some(CliCommand::Manage(ManageCommand::Task(
            TaskCommand::Create {
                project_id: "p1".into(),
                name: "NewTask".into(),
            },
        ))),
        ..Default::default()
    };

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    if let CliOutput::Success(msg) = result.unwrap() {
        assert!(msg.contains("Created task"));
    } else {
        panic!("Expected Success output");
    }
}

#[test]
fn test_given_existing_task_when_archiving_via_cli_then_archive_succeeds() {
    // Given
    let (persistence, _conn, _temp) = setup("test_cli_manage_task_archive");
    let engine = Engine::new(&persistence);
    let args = CliArgs {
        command: Some(CliCommand::Manage(ManageCommand::Task(
            TaskCommand::Archive {
                id: "t1".into(),
                project_id: "p1".into(),
            },
        ))),
        ..Default::default()
    };

    // When
    let archive_res = handle_cli(args, &persistence, &engine);

    // Then
    assert!(archive_res.is_ok());
}

#[test]
fn test_given_existing_project_when_renaming_via_cli_then_database_reflects_new_name() {
    // Given
    let (persistence, conn, _temp) = setup("test_cli_manage_project_rename");
    let engine = Engine::new(&persistence);
    let args = CliArgs {
        command: Some(CliCommand::Manage(ManageCommand::Project(
            ProjectCommand::Rename {
                id: "p1".into(),
                name: "RenamedProj".into(),
            },
        ))),
        ..Default::default()
    };

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok(), "rename should succeed");
    if let CliOutput::Success(msg) = result.unwrap() {
        assert!(msg.contains("Renamed project: p1"));
    } else {
        panic!("Expected Success output");
    }

    let name: String = conn
        .query_row("SELECT name FROM projects WHERE id = 'p1'", [], |r| {
            r.get(0)
        })
        .unwrap();
    assert_eq!(name, "RenamedProj");
}

#[test]
fn test_given_existing_task_when_renaming_via_cli_then_database_reflects_new_name() {
    // Given
    let (persistence, conn, _temp) = setup("test_cli_manage_task_rename");
    let engine = Engine::new(&persistence);
    let args = CliArgs {
        command: Some(CliCommand::Manage(ManageCommand::Task(
            TaskCommand::Rename {
                id: "t1".into(),
                name: "RenamedTask".into(),
            },
        ))),
        ..Default::default()
    };

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok(), "rename task should succeed");
    if let CliOutput::Success(msg) = result.unwrap() {
        assert!(msg.contains("Renamed task: t1"));
    } else {
        panic!("Expected Success output");
    }

    let name: String = conn
        .query_row("SELECT name FROM tasks WHERE id = 't1'", [], |r| r.get(0))
        .unwrap();
    assert_eq!(name, "RenamedTask");
}

#[test]
fn test_given_task_with_subtask_when_listing_subtasks_via_cli_then_outputs_subtask_details() {
    // Given
    let (persistence, _conn, _temp) = setup("test_cli_manage_subtask_list");
    let engine = Engine::new(&persistence);
    let subtask = TaskBuilder::new()
        .with_id("st1")
        .with_project_id("p1")
        .with_parent("t1")
        .with_name("Sub1")
        .build();
    persistence.tasks.create(subtask).unwrap();

    let args = CliArgs {
        command: Some(CliCommand::Manage(ManageCommand::Subtask(
            SubtaskCommand::List {
                task_id: "t1".into(),
            },
        ))),
        ..Default::default()
    };

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok(), "subtask list should succeed");
    if let CliOutput::Success(msg) = result.unwrap() {
        assert!(msg.contains("Subtasks for task t1:"));
        assert!(msg.contains("Sub1"));
        assert!(msg.contains("st1"));
    } else {
        panic!("Expected Success output");
    }
}

#[test]
fn test_given_cli_error_variants_when_mapped_to_exit_code_then_returns_semantic_posix_codes() {
    // Given
    use oxy_flow::cli::resolver::{EntityType, ResolveError};
    use oxy_flow::cli::shared::constants::{
        EXIT_CODE_CLI_SYNTAX, EXIT_CODE_ENGINE_ERROR, EXIT_CODE_ENTITY_ERROR,
        EXIT_CODE_GENERIC_FAILURE, EXIT_CODE_STORAGE_ERROR,
    };
    use oxy_flow::cli::CliError;

    let syntax_err = CliError::Syntax("invalid arg".into());
    let entity_err = CliError::Entity(ResolveError::NotFound {
        target: "missing".into(),
        entity_type: EntityType::Task,
    });
    let storage_err = CliError::Storage("io error".into());
    let engine_err = CliError::Engine("engine error".into());
    let business_err = CliError::Business("business rule".into());

    // When & Then
    assert_eq!(syntax_err.exit_code(), EXIT_CODE_CLI_SYNTAX);
    assert_eq!(entity_err.exit_code(), EXIT_CODE_ENTITY_ERROR);
    assert_eq!(storage_err.exit_code(), EXIT_CODE_STORAGE_ERROR);
    assert_eq!(engine_err.exit_code(), EXIT_CODE_ENGINE_ERROR);
    assert_eq!(business_err.exit_code(), EXIT_CODE_GENERIC_FAILURE);
}

#[test]
fn test_given_export_format_when_parsing_valid_format_then_parses_typed_enum() {
    // Given
    use clap::Parser;
    use oxy_flow::cli::parser::ReportSubcommand;
    use oxy_flow::cli::ExportFormat;

    // When
    let args = CliArgs::try_parse_from(["oxy", "report", "export", "-f", "csv", "-o", "out.csv"])
        .expect("should parse valid export format");

    // Then
    if let Some(CliCommand::Report(rep_args)) = args.command {
        if let Some(ReportSubcommand::Export { format, output }) = rep_args.command {
            assert_eq!(format, ExportFormat::Csv);
            assert_eq!(output, "out.csv");
        } else {
            panic!("Expected Export subcommand");
        }
    } else {
        panic!("Expected Report command");
    }
}
