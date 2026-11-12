use clap::Parser;
use oxyflow_timelog::cli::error::{CliError, CliSyntaxError};
use oxyflow_timelog::cli::handlers::report_schema_handler;
use oxyflow_timelog::cli::parser::{ReportSubcommand, SchemaFormat, SchemaTarget};
use oxyflow_timelog::cli::shared::output::CliOutput;
use oxyflow_timelog::cli::{CliArgs, CliCommand};

#[test]
fn test_given_xml_format_when_handling_report_schema_then_returns_syntax_error_pointing_at_json() {
    // Arrange
    let format = SchemaFormat::Xml;

    // Act
    let result = report_schema_handler::handle(None, format, SchemaTarget::Report, false);

    // Assert
    match result {
        Err(CliError::Syntax(CliSyntaxError::InvalidArgs(message))) => {
            assert!(message.contains("--format json"));
        }
        other => panic!("expected CliSyntaxError::InvalidArgs, got {other:?}"),
    }
}

#[test]
fn test_given_xml_format_when_handling_report_schema_then_exit_code_is_two() {
    // Arrange
    let format = SchemaFormat::Xml;

    // Act
    let error = report_schema_handler::handle(None, format, SchemaTarget::Envelope, true)
        .expect_err("xml must be rejected");

    // Assert
    assert_eq!(error.exit_code(), 2);
}

#[test]
fn test_given_json_format_when_handling_report_schema_then_returns_raw_json_document() {
    // Arrange
    let format = SchemaFormat::Json;

    // Act
    let output = report_schema_handler::handle(None, format, SchemaTarget::Report, true)
        .expect("json schema must be produced");

    // Assert
    match output {
        CliOutput::Raw(content) => {
            assert!(serde_json::from_str::<serde_json::Value>(&content).is_ok())
        }
        other => panic!("expected CliOutput::Raw, got {other:?}"),
    }
}

#[test]
fn test_given_no_flags_when_parsing_report_schema_then_defaults_to_json_report() {
    // Arrange
    let argv = ["oxy", "report", "schema"];

    // Act
    let args = CliArgs::try_parse_from(argv).expect("valid command");

    // Assert
    let report = match args.command {
        Some(CliCommand::Report(report)) => report,
        other => panic!("expected report command, got {other:?}"),
    };
    match report.command {
        Some(ReportSubcommand::Schema { format, target, .. }) => {
            assert_eq!(format, SchemaFormat::Json);
            assert_eq!(target, SchemaTarget::Report);
        }
        other => panic!("expected schema subcommand, got {other:?}"),
    }
}

#[test]
fn test_given_unknown_format_when_parsing_report_schema_then_clap_rejects_it() {
    // Arrange
    let argv = ["oxy", "report", "schema", "--format", "yaml"];

    // Act
    let parsed = CliArgs::try_parse_from(argv);

    // Assert
    assert!(parsed.is_err());
}

#[test]
fn test_given_removed_version_flag_when_parsing_report_schema_then_clap_rejects_it() {
    // Arrange
    let argv = ["oxy", "report", "schema", "--version", "1"];

    // Act
    let parsed = CliArgs::try_parse_from(argv);

    // Assert
    assert!(parsed.is_err());
}
