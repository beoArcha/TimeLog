use clap::Parser;
use oxy_flow::cli::parser::tier1_flow::{StartArgs, StopArgs, SwitchArgs};
use oxy_flow::cli::parser::tier2_entities::{LogSubcommand, ProjectSubcommand, TaskSubcommand};
use oxy_flow::cli::{CliArgs, CliCommand};

#[test]
fn test_given_no_subcommand_when_parsing_cli_then_command_is_none() {
    // Arrange
    let args = vec!["oxy"];

    // Act
    let parsed = CliArgs::try_parse_from(args).expect("parsing empty args should succeed");

    // Assert
    assert!(parsed.command.is_none());
    assert!(!parsed.machine);
    assert!(!parsed.json);
    assert!(!parsed.quiet);
}

#[test]
fn test_given_global_flags_when_parsing_cli_then_flags_are_captured() {
    // Arrange
    let args = vec!["oxy", "-m", "-j", "-q", "status"];

    // Act
    let parsed = CliArgs::try_parse_from(args).expect("parsing with global flags should succeed");

    // Assert
    assert!(parsed.machine);
    assert!(parsed.json);
    assert!(parsed.quiet);
    assert!(matches!(parsed.command, Some(CliCommand::Status)));
}

#[test]
fn test_given_start_shortcut_when_parsing_cli_then_captures_target() {
    // Arrange
    let args = vec!["oxy", "start", "auth"];
    let alias_args = vec!["oxy", "s", "auth"];

    // Act
    let parsed = CliArgs::try_parse_from(args).expect("start command");
    let parsed_alias = CliArgs::try_parse_from(alias_args).expect("s alias");

    // Assert
    assert!(matches!(
        parsed.command,
        Some(CliCommand::Start(StartArgs {
            target: Some(ref t)
        })) if t == "auth"
    ));
    assert!(matches!(
        parsed_alias.command,
        Some(CliCommand::Start(StartArgs {
            target: Some(ref t)
        })) if t == "auth"
    ));
}

#[test]
fn test_given_stop_shortcut_when_parsing_cli_then_captures_all_flag() {
    // Arrange
    let args = vec!["oxy", "stop", "--all"];
    let alias_args = vec!["oxy", "sp"];

    // Act
    let parsed = CliArgs::try_parse_from(args).expect("stop command");
    let parsed_alias = CliArgs::try_parse_from(alias_args).expect("sp alias");

    // Assert
    assert!(matches!(
        parsed.command,
        Some(CliCommand::Stop(StopArgs { all: true }))
    ));
    assert!(matches!(
        parsed_alias.command,
        Some(CliCommand::Stop(StopArgs { all: false }))
    ));
}

#[test]
fn test_given_switch_shortcut_when_parsing_cli_then_captures_target() {
    // Arrange
    let args = vec!["oxy", "switch", "api-docs"];
    let alias_args = vec!["oxy", "sw", "api-docs"];

    // Act
    let parsed = CliArgs::try_parse_from(args).expect("switch command");
    let parsed_alias = CliArgs::try_parse_from(alias_args).expect("sw alias");

    // Assert
    assert!(matches!(
        parsed.command,
        Some(CliCommand::Switch(SwitchArgs { ref target })) if target == "api-docs"
    ));
    assert!(matches!(
        parsed_alias.command,
        Some(CliCommand::Switch(SwitchArgs { ref target })) if target == "api-docs"
    ));
}

#[test]
fn test_given_status_and_today_shortcuts_when_parsing_cli_then_routes_correctly() {
    // Arrange & Act
    let st = CliArgs::try_parse_from(vec!["oxy", "st"]).expect("st alias");
    let today = CliArgs::try_parse_from(vec!["oxy", "today"]).expect("today");
    let summary = CliArgs::try_parse_from(vec!["oxy", "summary"]).expect("summary alias");

    // Assert
    assert!(matches!(st.command, Some(CliCommand::Status)));
    assert!(matches!(today.command, Some(CliCommand::Today)));
    assert!(matches!(summary.command, Some(CliCommand::Today)));
}

#[test]
fn test_given_project_domain_commands_when_parsing_cli_then_maps_to_subcommands() {
    // Arrange
    let ls = CliArgs::try_parse_from(vec!["oxy", "p", "ls", "--all"]).expect("p ls");
    let add = CliArgs::try_parse_from(vec!["oxy", "project", "add", "Backend", "-c", "red"])
        .expect("project add");
    let ren = CliArgs::try_parse_from(vec!["oxy", "p", "ren", "p1", "NewName"]).expect("p ren");
    let rm = CliArgs::try_parse_from(vec!["oxy", "p", "rm", "p1"]).expect("p rm");

    // Assert
    match ls.command {
        Some(CliCommand::Project(args)) => {
            assert!(matches!(
                args.command,
                ProjectSubcommand::List { all: true }
            ));
        }
        other => panic!("Expected Project List, got: {:?}", other),
    }

    match add.command {
        Some(CliCommand::Project(args)) => {
            assert!(matches!(
                args.command,
                ProjectSubcommand::Add { ref name, ref color, .. }
                    if name == "Backend" && color.as_deref() == Some("red")
            ));
        }
        other => panic!("Expected Project Add, got: {:?}", other),
    }

    match ren.command {
        Some(CliCommand::Project(args)) => {
            assert!(matches!(
                args.command,
                ProjectSubcommand::Rename {
                    ref target,
                    ref new_name,
                    color: None,
                    ..
                } if target == "p1" && new_name.as_deref() == Some("NewName")
            ));
        }
        other => panic!("Expected Project Rename, got: {:?}", other),
    }

    match rm.command {
        Some(CliCommand::Project(args)) => {
            assert!(matches!(
                args.command,
                ProjectSubcommand::Archive { ref target } if target == "p1"
            ));
        }
        other => panic!("Expected Project Archive, got: {:?}", other),
    }
}

#[test]
fn test_given_task_domain_commands_when_parsing_cli_then_maps_subtasks_and_done() {
    // Arrange
    let add_subtask = CliArgs::try_parse_from(vec![
        "oxy", "t", "add", "SubTask1", "-p", "p1", "-P", "parent1",
    ])
    .expect("t add subtask");
    let done = CliArgs::try_parse_from(vec!["oxy", "t", "done", "auth"]).expect("t done");
    let reparent = CliArgs::try_parse_from(vec!["oxy", "task", "reparent", "child", "new_parent"])
        .expect("task reparent");
    let move_task =
        CliArgs::try_parse_from(vec!["oxy", "task", "move", "task1", "proj2"]).expect("task move");

    // Assert
    match add_subtask.command {
        Some(CliCommand::Task(args)) => {
            assert!(matches!(
                args.command,
                TaskSubcommand::Add {
                    ref name,
                    ref project,
                    ref parent,
                    ..
                } if name == "SubTask1"
                    && project.as_deref() == Some("p1")
                    && parent.as_deref() == Some("parent1")
            ));
        }
        other => panic!("Expected Task Add, got: {:?}", other),
    }

    match done.command {
        Some(CliCommand::Task(args)) => {
            assert!(matches!(
                args.command,
                TaskSubcommand::Done { ref target } if target == "auth"
            ));
        }
        other => panic!("Expected Task Done, got: {:?}", other),
    }

    match reparent.command {
        Some(CliCommand::Task(args)) => {
            assert!(matches!(
                args.command,
                TaskSubcommand::Reparent {
                    ref target,
                    ref new_parent
                } if target == "child" && new_parent == "new_parent"
            ));
        }
        other => panic!("Expected Task Reparent, got: {:?}", other),
    }

    match move_task.command {
        Some(CliCommand::Task(args)) => {
            assert!(matches!(
                args.command,
                TaskSubcommand::Move {
                    ref target,
                    ref new_project
                } if target == "task1" && new_project == "proj2"
            ));
        }
        other => panic!("Expected Task Move, got: {:?}", other),
    }
}

#[test]
fn test_given_log_domain_commands_when_parsing_cli_then_parses_duration_and_note() {
    // Arrange
    let add_log = CliArgs::try_parse_from(vec![
        "oxy",
        "l",
        "add",
        "auth",
        "45m",
        "Fixed token refresh",
    ])
    .expect("l add");

    // Assert
    match add_log.command {
        Some(CliCommand::Log(args)) => {
            assert!(matches!(
                args.command,
                LogSubcommand::Add {
                    ref target,
                    ref duration,
                    ref note,
                    ..
                } if target == "auth"
                    && duration.as_deref() == Some("45m")
                    && note.as_deref() == Some("Fixed token refresh")
            ));
        }
        other => panic!("Expected Log Add, got: {:?}", other),
    }

    let add_explicit = CliArgs::try_parse_from(vec![
        "oxy",
        "log",
        "add",
        "auth",
        "--from",
        "2026-10-24T10:00:00Z",
        "--to",
        "2026-10-24T11:00:00Z",
        "--note",
        "Explicit range",
    ])
    .expect("log add explicit");

    match add_explicit.command {
        Some(CliCommand::Log(args)) => {
            assert!(matches!(
                args.command,
                LogSubcommand::Add {
                    ref target,
                    ref from,
                    ref to,
                    ref explicit_note,
                    ..
                } if target == "auth"
                    && from.as_deref() == Some("2026-10-24T10:00:00Z")
                    && to.as_deref() == Some("2026-10-24T11:00:00Z")
                    && explicit_note.as_deref() == Some("Explicit range")
            ));
        }
        other => panic!("Expected Log Add explicit, got: {:?}", other),
    }

    let edit_log = CliArgs::try_parse_from(vec![
        "oxy",
        "log",
        "edit",
        "log-123",
        "--start",
        "2026-10-24T09:00:00Z",
        "--end",
        "2026-10-24T10:30:00Z",
        "--task",
        "backend",
    ])
    .expect("log edit");

    match edit_log.command {
        Some(CliCommand::Log(args)) => {
            assert!(matches!(
                args.command,
                LogSubcommand::Edit {
                    ref id,
                    ref start,
                    ref end,
                    ref task,
                    ..
                } if id == "log-123"
                    && start.as_deref() == Some("2026-10-24T09:00:00Z")
                    && end.as_deref() == Some("2026-10-24T10:30:00Z")
                    && task.as_deref() == Some("backend")
            ));
        }
        other => panic!("Expected Log Edit, got: {:?}", other),
    }

    let list_logs = CliArgs::try_parse_from(vec![
        "oxy",
        "log",
        "ls",
        "-p",
        "Website",
        "--month",
        "--from",
        "2026-10-01",
        "--to",
        "2026-10-31",
    ])
    .expect("log ls");

    match list_logs.command {
        Some(CliCommand::Log(args)) => {
            assert!(matches!(
                args.command,
                LogSubcommand::List {
                    ref project,
                    month: true,
                    ref from,
                    ref to,
                    ..
                } if project.as_deref() == Some("Website")
                    && from.as_deref() == Some("2026-10-01")
                    && to.as_deref() == Some("2026-10-31")
            ));
        }
        other => panic!("Expected Log List, got: {:?}", other),
    }
}

#[test]
fn test_given_billing_cli_commands_when_parsing_then_binds_rate_and_currency() {
    // Project add with rate and currency
    let proj_add = CliArgs::try_parse_from(vec![
        "oxy", "project", "add", "ClientX", "--rate", "15000", "--currency", "USD",
    ])
    .expect("project add with rate and currency");

    match proj_add.command {
        Some(CliCommand::Project(args)) => {
            assert!(matches!(
                args.command,
                ProjectSubcommand::Add {
                    ref name,
                    ref rate,
                    ref currency,
                    ..
                } if name == "ClientX"
                    && rate.as_deref() == Some("15000")
                    && currency.as_deref() == Some("USD")
            ));
        }
        other => panic!("Expected Project Add, got: {:?}", other),
    }

    // Project update alias with rate and currency
    let proj_update = CliArgs::try_parse_from(vec![
        "oxy", "project", "update", "ClientX", "--rate", "12000", "--currency", "EUR",
    ])
    .expect("project update with rate and currency");

    match proj_update.command {
        Some(CliCommand::Project(args)) => {
            assert!(matches!(
                args.command,
                ProjectSubcommand::Rename {
                    ref target,
                    ref rate,
                    ref currency,
                    ..
                } if target == "ClientX"
                    && rate.as_deref() == Some("12000")
                    && currency.as_deref() == Some("EUR")
            ));
        }
        other => panic!("Expected Project Update, got: {:?}", other),
    }

    // Task rate command with cents only
    let task_rate = CliArgs::try_parse_from(vec![
        "oxy", "task", "rate", "t-123", "18000",
    ])
    .expect("task rate command");

    match task_rate.command {
        Some(CliCommand::Task(args)) => {
            assert!(matches!(
                args.command,
                TaskSubcommand::Rate {
                    ref target,
                    ref rate,
                    ref currency,
                } if target == "t-123"
                    && rate == "18000"
                    && currency.is_none()
            ));
        }
        other => panic!("Expected Task Rate, got: {:?}", other),
    }

    // Task rate command with cents and currency override
    let task_rate_curr = CliArgs::try_parse_from(vec![
        "oxy", "task", "rate", "t-123", "20000", "--currency", "GBP",
    ])
    .expect("task rate command with currency");

    match task_rate_curr.command {
        Some(CliCommand::Task(args)) => {
            assert!(matches!(
                args.command,
                TaskSubcommand::Rate {
                    ref target,
                    ref rate,
                    ref currency,
                } if target == "t-123"
                    && rate == "20000"
                    && currency.as_deref() == Some("GBP")
            ));
        }
        other => panic!("Expected Task Rate with currency, got: {:?}", other),
    }
}
