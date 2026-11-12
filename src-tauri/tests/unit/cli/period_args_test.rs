use clap::Parser;
use oxyflow_timelog::cli::parser::period_args::PeriodArgs;
use oxyflow_timelog::cli::parser::tier2_entities::LogSubcommand;
use oxyflow_timelog::cli::parser::tier3_subsystems::ReportSubcommand;
use oxyflow_timelog::cli::{CliArgs, CliCommand};
use oxyflow_timelog::types::RangePreset;

#[derive(Parser, Debug)]
struct PeriodHarness {
    #[command(flatten)]
    period: PeriodArgs,
}

fn parse_period(flags: &[&str]) -> Result<PeriodArgs, clap::Error> {
    let args = std::iter::once("harness").chain(flags.iter().copied());
    PeriodHarness::try_parse_from(args).map(|harness| harness.period)
}

#[test]
fn test_given_each_preset_flag_when_parsing_period_then_maps_to_matching_preset() {
    let cases = [
        ("--today", RangePreset::Today),
        ("--yesterday", RangePreset::Yesterday),
        ("--week", RangePreset::Week),
        ("--last-week", RangePreset::LastWeek),
        ("--month", RangePreset::Month),
        ("--last-month", RangePreset::LastMonth),
    ];
    for (flag, expected) in cases {
        // Arrange
        let flags = [flag];

        // Act
        let period = parse_period(&flags).unwrap();

        // Assert
        assert_eq!(period.preset(), Some(expected), "{flag}");
    }
}

#[test]
fn test_given_no_flags_when_resolving_preset_then_defaults_to_all_time() {
    // Arrange
    let period = PeriodArgs::default();

    // Act
    let preset = period.preset();

    // Assert
    assert_eq!(preset, Some(RangePreset::All));
}

#[test]
fn test_given_custom_bounds_when_resolving_preset_then_has_no_preset() {
    // Arrange
    let period = parse_period(&["--from", "2026-10-01"]).unwrap();

    // Act
    let preset = period.preset();

    // Assert
    assert_eq!(preset, None);
}

#[test]
fn test_given_two_presets_when_parsing_period_then_rejects_conflict() {
    // Arrange
    let flags = ["--today", "--week"];

    // Act
    let result = parse_period(&flags);

    // Assert
    assert!(result.is_err());
}

#[test]
fn test_given_preset_and_from_when_parsing_period_then_rejects_conflict() {
    // Arrange
    let flags = ["--yesterday", "--from", "2026-10-01"];

    // Act
    let result = parse_period(&flags);

    // Assert
    assert!(result.is_err());
}

#[test]
fn test_given_preset_and_to_when_parsing_period_then_rejects_conflict() {
    // Arrange
    let flags = ["--last-month", "--to", "2026-10-31"];

    // Act
    let result = parse_period(&flags);

    // Assert
    assert!(result.is_err());
}

#[test]
fn test_given_from_and_to_without_preset_when_parsing_period_then_parses() {
    // Arrange
    let flags = ["--from", "2026-10-01", "--to", "2026-10-31"];

    // Act
    let result = parse_period(&flags);

    // Assert
    assert!(result.is_ok());
}

#[test]
fn test_given_period_and_timezone_when_building_request_then_copies_all_fields() {
    // Arrange
    let period = parse_period(&["--last-week"]).unwrap();

    // Act
    let request = period.to_range_request(Some("Europe/Warsaw"));

    // Assert
    assert_eq!(request.preset, Some(RangePreset::LastWeek));
    assert_eq!(request.timezone.as_deref(), Some("Europe/Warsaw"));
    assert_eq!(request.from, None);
}

#[test]
fn test_given_subcommand_period_set_when_merging_with_parent_then_keeps_subcommand_period() {
    // Arrange
    let child = parse_period(&["--week"]).unwrap();
    let parent = parse_period(&["--month"]).unwrap();

    // Act
    let merged = child.or(parent);

    // Assert
    assert_eq!(merged.preset(), Some(RangePreset::Week));
}

#[test]
fn test_given_subcommand_period_empty_when_merging_with_parent_then_uses_parent_period() {
    // Arrange
    let child = PeriodArgs::default();
    let parent = parse_period(&["--month"]).unwrap();

    // Act
    let merged = child.or(parent);

    // Assert
    assert_eq!(merged.preset(), Some(RangePreset::Month));
}

#[test]
fn test_given_period_flags_when_parsing_log_ls_then_binds_period() {
    // Arrange
    let args = ["oxy", "log", "ls", "--last-week"];

    // Act
    let parsed = CliArgs::try_parse_from(args).unwrap();

    // Assert
    match parsed.command {
        Some(CliCommand::Log(log)) => match log.command {
            LogSubcommand::List { period, .. } => assert!(period.last_week),
            other => panic!("Expected Log List, got: {other:?}"),
        },
        other => panic!("Expected Log, got: {other:?}"),
    }
}

#[test]
fn test_given_period_flags_when_parsing_report_then_binds_period() {
    // Arrange
    let args = ["oxy", "report", "--yesterday"];

    // Act
    let parsed = CliArgs::try_parse_from(args).unwrap();

    // Assert
    match parsed.command {
        Some(CliCommand::Report(report)) => assert!(report.period.yesterday),
        other => panic!("Expected Report, got: {other:?}"),
    }
}

#[test]
fn test_given_period_flags_when_parsing_report_tree_then_binds_period() {
    // Arrange
    let args = ["oxy", "report", "tree", "--month"];

    // Act
    let parsed = CliArgs::try_parse_from(args).unwrap();

    // Assert
    match parsed.command {
        Some(CliCommand::Report(report)) => match report.command {
            Some(ReportSubcommand::Tree { period, .. }) => assert!(period.month),
            other => panic!("Expected Report Tree, got: {other:?}"),
        },
        other => panic!("Expected Report, got: {other:?}"),
    }
}

#[test]
fn test_given_period_flags_when_parsing_report_export_then_binds_period() {
    // Arrange
    let args = [
        "oxy",
        "report",
        "export",
        "-f",
        "csv",
        "-o",
        "out.csv",
        "--from",
        "2026-10-01",
        "--to",
        "2026-10-31",
    ];

    // Act
    let parsed = CliArgs::try_parse_from(args).unwrap();

    // Assert
    match parsed.command {
        Some(CliCommand::Report(report)) => match report.command {
            Some(ReportSubcommand::Export { period, .. }) => {
                assert_eq!(period.from.as_deref(), Some("2026-10-01"));
                assert_eq!(period.to.as_deref(), Some("2026-10-31"));
            }
            other => panic!("Expected Report Export, got: {other:?}"),
        },
        other => panic!("Expected Report, got: {other:?}"),
    }
}

#[test]
fn test_given_conflicting_presets_when_parsing_each_command_then_rejects_them() {
    let invocations: [&[&str]; 4] = [
        &["oxy", "log", "ls", "--today", "--week"],
        &["oxy", "report", "--today", "--week"],
        &["oxy", "report", "tree", "--today", "--week"],
        &[
            "oxy", "report", "export", "-f", "csv", "-o", "o.csv", "--today", "--week",
        ],
    ];
    for args in invocations {
        // Arrange
        let argv = args.to_vec();

        // Act
        let parsed = CliArgs::try_parse_from(argv);

        // Assert
        assert!(parsed.is_err(), "{args:?}");
    }
}

#[test]
fn test_given_tz_flag_after_subcommand_when_parsing_then_captures_zone() {
    // Arrange
    let args = ["oxy", "log", "ls", "--week", "--tz", "Europe/Warsaw"];

    // Act
    let parsed = CliArgs::try_parse_from(args).unwrap();

    // Assert
    assert_eq!(parsed.tz.as_deref(), Some("Europe/Warsaw"));
}

#[test]
fn test_given_tz_flag_before_today_when_parsing_then_captures_zone() {
    // Arrange
    let args = ["oxy", "--tz", "Asia/Tokyo", "today"];

    // Act
    let parsed = CliArgs::try_parse_from(args).unwrap();

    // Assert
    assert_eq!(parsed.tz.as_deref(), Some("Asia/Tokyo"));
}
