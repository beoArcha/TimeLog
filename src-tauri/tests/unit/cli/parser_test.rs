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
                ProjectSubcommand::Add { ref name, ref color }
                    if name == "Backend" && color.as_deref() == Some("red")
            ));
        }
        other => panic!("Expected Project Add, got: {:?}", other),
    }

    match ren.command {
        Some(CliCommand::Project(args)) => {
            assert!(matches!(
                args.command,
                ProjectSubcommand::Rename { ref target, ref new_name }
                    if target == "p1" && new_name == "NewName"
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

    // Assert
    match add_subtask.command {
        Some(CliCommand::Task(args)) => {
            assert!(matches!(
                args.command,
                TaskSubcommand::Add {
                    ref name,
                    ref project,
                    ref parent
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
                    ref note
                } if target == "auth"
                    && duration == "45m"
                    && note.as_deref() == Some("Fixed token refresh")
            ));
        }
        other => panic!("Expected Log Add, got: {:?}", other),
    }
}
