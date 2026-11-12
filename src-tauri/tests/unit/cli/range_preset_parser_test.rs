use clap::Parser;
use oxyflow_timelog::cli::parser::tier2_entities::LogSubcommand;
use oxyflow_timelog::cli::{CliArgs, CliCommand};

const PRESET_FLAGS: [&str; 6] = [
    "--today",
    "--yesterday",
    "--week",
    "--last-week",
    "--month",
    "--last-month",
];

#[test]
fn test_given_each_preset_flag_when_parsing_log_ls_then_parses() {
    for flag in PRESET_FLAGS {
        // Arrange
        let args = vec!["oxy", "log", "ls", flag];

        // Act
        let parsed = CliArgs::try_parse_from(args);

        // Assert
        assert!(parsed.is_ok(), "{flag} should parse on log ls");
    }
}

#[test]
fn test_given_each_preset_flag_when_parsing_report_then_parses() {
    for flag in PRESET_FLAGS {
        // Arrange
        let args = vec!["oxy", "report", flag];

        // Act
        let parsed = CliArgs::try_parse_from(args);

        // Assert
        assert!(parsed.is_ok(), "{flag} should parse on report");
    }
}

#[test]
fn test_given_last_week_flag_when_parsing_log_ls_then_binds_last_week() {
    // Arrange
    let args = vec!["oxy", "log", "ls", "--last-week"];

    // Act
    let parsed = CliArgs::try_parse_from(args).unwrap();

    // Assert
    match parsed.command {
        Some(CliCommand::Log(log)) => assert!(matches!(
            log.command,
            LogSubcommand::List {
                last_week: true,
                week: false,
                ..
            }
        )),
        other => panic!("Expected Log List, got: {other:?}"),
    }
}

#[test]
fn test_given_two_presets_when_parsing_log_ls_then_rejects_conflict() {
    // Arrange
    let args = vec!["oxy", "log", "ls", "--today", "--week"];

    // Act
    let parsed = CliArgs::try_parse_from(args);

    // Assert
    assert!(parsed.is_err());
}

#[test]
fn test_given_preset_and_from_when_parsing_log_ls_then_rejects_conflict() {
    // Arrange
    let args = vec!["oxy", "log", "ls", "--yesterday", "--from", "2026-10-01"];

    // Act
    let parsed = CliArgs::try_parse_from(args);

    // Assert
    assert!(parsed.is_err());
}

#[test]
fn test_given_preset_and_to_when_parsing_report_then_rejects_conflict() {
    // Arrange
    let args = vec!["oxy", "report", "--last-month", "--to", "2026-10-31"];

    // Act
    let parsed = CliArgs::try_parse_from(args);

    // Assert
    assert!(parsed.is_err());
}

#[test]
fn test_given_two_presets_when_parsing_report_export_then_rejects_conflict() {
    // Arrange
    let args = vec![
        "oxy",
        "report",
        "export",
        "-f",
        "csv",
        "-o",
        "out.csv",
        "--week",
        "--last-week",
    ];

    // Act
    let parsed = CliArgs::try_parse_from(args);

    // Assert
    assert!(parsed.is_err());
}

#[test]
fn test_given_from_and_to_without_preset_when_parsing_report_then_parses() {
    // Arrange
    let args = vec![
        "oxy",
        "report",
        "--from",
        "2026-10-01",
        "--to",
        "2026-10-31",
    ];

    // Act
    let parsed = CliArgs::try_parse_from(args);

    // Assert
    assert!(parsed.is_ok());
}

#[test]
fn test_given_tz_flag_after_subcommand_when_parsing_then_captures_zone() {
    // Arrange
    let args = vec!["oxy", "log", "ls", "--week", "--tz", "Europe/Warsaw"];

    // Act
    let parsed = CliArgs::try_parse_from(args).unwrap();

    // Assert
    assert_eq!(parsed.tz.as_deref(), Some("Europe/Warsaw"));
}

#[test]
fn test_given_tz_flag_before_today_when_parsing_then_captures_zone() {
    // Arrange
    let args = vec!["oxy", "--tz", "Asia/Tokyo", "today"];

    // Act
    let parsed = CliArgs::try_parse_from(args).unwrap();

    // Assert
    assert_eq!(parsed.tz.as_deref(), Some("Asia/Tokyo"));
}
