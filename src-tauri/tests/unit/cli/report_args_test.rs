use clap::Parser;
use oxyflow_timelog::cli::parser::{
    CliArgs, CliCommand, ExportFormat, ReportArgs, ReportSubcommand, ReportVariantArg,
};

fn parse_report(argv: &[&str]) -> ReportArgs {
    let parsed = CliArgs::try_parse_from(argv).expect("report args must parse");
    match parsed.command {
        Some(CliCommand::Report(report)) => report,
        other => panic!("Expected Report, got: {other:?}"),
    }
}

#[test]
fn test_given_bare_report_when_parsing_then_defaults_to_full_table_without_output() {
    // Arrange
    let argv = ["oxy", "report"];

    // Act
    let report = parse_report(&argv);

    // Assert
    assert_eq!(report.format, ExportFormat::Table);
    assert_eq!(report.variant, ReportVariantArg::Full);
    assert_eq!(report.output, None);
    assert_eq!(report.command, None);
}

#[test]
fn test_given_format_variant_and_output_flags_when_parsing_report_then_binds_them() {
    // Arrange
    let argv = [
        "oxy",
        "report",
        "--format",
        "csv",
        "--variant",
        "summary",
        "-o",
        "out.csv",
    ];

    // Act
    let report = parse_report(&argv);

    // Assert
    assert_eq!(report.format, ExportFormat::Csv);
    assert_eq!(report.variant, ReportVariantArg::Summary);
    assert_eq!(report.output.as_deref(), Some("out.csv"));
}

#[test]
fn test_given_dash_output_when_parsing_report_then_keeps_it_as_the_stdout_marker() {
    // Arrange
    let argv = ["oxy", "report", "-f", "json", "-o", "-"];

    // Act
    let report = parse_report(&argv);

    // Assert
    assert_eq!(report.output.as_deref(), Some("-"));
}

#[test]
fn test_given_schema_subcommand_when_parsing_report_then_still_binds_schema() {
    // Arrange
    let argv = ["oxy", "report", "schema"];

    // Act
    let report = parse_report(&argv);

    // Assert
    assert!(matches!(
        report.command,
        Some(ReportSubcommand::Schema { .. })
    ));
}

#[test]
fn test_given_removed_report_forms_when_parsing_then_rejects_them() {
    let removed: [&[&str]; 4] = [
        &["oxy", "report", "export", "-f", "csv", "-o", "out.csv"],
        &["oxy", "report", "tree"],
        &["oxy", "report", "--tree"],
        &["oxy", "report", "--variant", "everything"],
    ];
    for argv in removed {
        // Act
        let parsed = CliArgs::try_parse_from(argv);

        // Assert
        assert!(parsed.is_err(), "{argv:?}");
    }
}
