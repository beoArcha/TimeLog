use clap::Parser;
use oxyflow_timelog::cli::parser::tier2_entities::LogSubcommand;
use oxyflow_timelog::cli::{CliArgs, CliCommand};

#[test]
fn test_log_edit_parser_with_long_reason_flag() {
    let parsed = CliArgs::try_parse_from([
        "oxy",
        "log",
        "edit",
        "log-100",
        "--duration",
        "45m",
        "--reason",
        "Adjusted meeting duration",
    ])
    .expect("parse log edit with --reason");

    match parsed.command {
        Some(CliCommand::Log(args)) => match args.command {
            LogSubcommand::Edit {
                id,
                duration,
                reason,
                ..
            } => {
                assert_eq!(id, "log-100");
                assert_eq!(duration.as_deref(), Some("45m"));
                assert_eq!(reason.as_deref(), Some("Adjusted meeting duration"));
            }
            other => panic!("Expected LogSubcommand::Edit, got: {:?}", other),
        },
        other => panic!("Expected CliCommand::Log, got: {:?}", other),
    }
}

#[test]
fn test_log_edit_parser_with_short_reason_flag() {
    let parsed = CliArgs::try_parse_from([
        "oxy",
        "log",
        "edit",
        "log-200",
        "--note",
        "Client call",
        "-r",
        "Updated client call note",
    ])
    .expect("parse log edit with -r");

    match parsed.command {
        Some(CliCommand::Log(args)) => match args.command {
            LogSubcommand::Edit {
                id, note, reason, ..
            } => {
                assert_eq!(id, "log-200");
                assert_eq!(note.as_deref(), Some("Client call"));
                assert_eq!(reason.as_deref(), Some("Updated client call note"));
            }
            other => panic!("Expected LogSubcommand::Edit, got: {:?}", other),
        },
        other => panic!("Expected CliCommand::Log, got: {:?}", other),
    }
}

#[test]
fn test_log_edit_parser_without_reason_flag_parses_none() {
    let parsed = CliArgs::try_parse_from([
        "oxy",
        "log",
        "edit",
        "log-300",
        "--start",
        "2026-10-24T10:00:00Z",
    ])
    .expect("parse log edit without reason");

    match parsed.command {
        Some(CliCommand::Log(args)) => match args.command {
            LogSubcommand::Edit { id, reason, .. } => {
                assert_eq!(id, "log-300");
                assert_eq!(reason, None);
            }
            other => panic!("Expected LogSubcommand::Edit, got: {:?}", other),
        },
        other => panic!("Expected CliCommand::Log, got: {:?}", other),
    }
}

#[test]
fn test_log_edit_parser_help_contains_reason_and_short_flag() {
    let err = CliArgs::try_parse_from(["oxy", "log", "edit", "--help"])
        .expect_err("help triggers clap display");
    let help_text = err.to_string();

    assert!(
        help_text.contains("-r") || help_text.contains("--reason"),
        "Help text must document -r / --reason flag"
    );
    assert!(
        help_text.contains("Reason for editing"),
        "Help text must explain audit reason"
    );
}

#[test]
fn test_log_edit_parser_with_explicit_utc_and_offset_timestamps() {
    let parsed_z = CliArgs::try_parse_from([
        "oxy",
        "log",
        "edit",
        "log-400",
        "--start",
        "2026-10-24T10:00:00Z",
        "--end",
        "2026-10-24T11:00:00Z",
        "-r",
        "Testing Z offset",
    ])
    .expect("parse log edit with Z");

    match parsed_z.command {
        Some(CliCommand::Log(args)) => match args.command {
            LogSubcommand::Edit { start, end, .. } => {
                assert_eq!(start.as_deref(), Some("2026-10-24T10:00:00Z"));
                assert_eq!(end.as_deref(), Some("2026-10-24T11:00:00Z"));
            }
            other => panic!("Expected LogSubcommand::Edit, got: {:?}", other),
        },
        other => panic!("Expected CliCommand::Log, got: {:?}", other),
    }

    let parsed_offset = CliArgs::try_parse_from([
        "oxy",
        "log",
        "edit",
        "log-500",
        "--start",
        "2026-10-24T12:00:00+02:00",
        "--end",
        "2026-10-24T13:00:00+02:00",
        "-r",
        "Testing +02:00 offset",
    ])
    .expect("parse log edit with +02:00 offset");

    match parsed_offset.command {
        Some(CliCommand::Log(args)) => match args.command {
            LogSubcommand::Edit { start, end, .. } => {
                assert_eq!(start.as_deref(), Some("2026-10-24T12:00:00+02:00"));
                assert_eq!(end.as_deref(), Some("2026-10-24T13:00:00+02:00"));
            }
            other => panic!("Expected LogSubcommand::Edit, got: {:?}", other),
        },
        other => panic!("Expected CliCommand::Log, got: {:?}", other),
    }
}
