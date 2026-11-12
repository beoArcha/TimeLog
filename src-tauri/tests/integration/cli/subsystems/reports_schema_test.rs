use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxyflow_timelog::cli::error::CliError;
use oxyflow_timelog::cli::exporters::{
    envelope_json_schema, report_json_schema, REPORT_XML_SCHEMA_V1,
};
use oxyflow_timelog::cli::{handle_cli, CliArgs, CliOutput};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use serde_json::Value;
use std::fs;

fn run(db_name: &str, argv: &[&str]) -> Result<CliOutput, CliError> {
    let (_conn, config, _temp) = setup_persistence_test(db_name);
    let persistence = Persistence::new(&config).expect("persistence layer setup");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(argv).expect("valid CLI command");
    handle_cli(args, &persistence, &engine)
}

#[test]
fn test_given_no_flag_when_report_schema_invoked_then_prints_the_generated_report_schema() {
    // Given
    let expected = report_json_schema().unwrap();

    // When
    let result = run("test_report_schema_stdout", &["oxy", "report", "schema"]);

    // Then
    match result.expect("command must succeed") {
        CliOutput::Raw(content) => assert_eq!(content, expected),
        other => panic!("expected CliOutput::Raw, got: {other:?}"),
    }
}

#[test]
fn test_given_json_format_when_report_schema_invoked_then_prints_the_same_schema_as_the_default() {
    // When
    let default = run("test_report_schema_default", &["oxy", "report", "schema"]).unwrap();
    let explicit = run(
        "test_report_schema_json",
        &["oxy", "report", "schema", "--format", "json"],
    )
    .unwrap();

    // Then
    assert_eq!(default.to_string(), explicit.to_string());
}

#[test]
fn test_given_machine_flag_without_output_when_report_schema_invoked_then_stdout_is_the_bare_schema(
) {
    // When
    let result = run(
        "test_report_schema_machine_stdout",
        &["oxy", "-m", "report", "schema"],
    );

    // Then
    let printed = result.expect("command must succeed").to_string();
    let parsed: Value = serde_json::from_str(&printed).expect("stdout must be one JSON document");
    assert_eq!(parsed["$id"], "urn:oxyflow:schema:oxy.report:2");
}

#[test]
fn test_given_envelope_target_when_report_schema_invoked_then_prints_the_envelope_schema() {
    // When
    let result = run(
        "test_report_schema_envelope",
        &["oxy", "report", "schema", "--target", "envelope"],
    );

    // Then
    match result.expect("command must succeed") {
        CliOutput::Raw(content) => assert_eq!(content, envelope_json_schema().unwrap()),
        other => panic!("expected CliOutput::Raw, got: {other:?}"),
    }
}

#[test]
fn test_given_output_path_when_report_schema_invoked_then_writes_the_schema_file() {
    // Given
    let temp_dir = tempfile::tempdir().expect("temp dir creation");
    let target_file = temp_dir.path().join("schemas").join("report.schema.json");
    let target = target_file.to_str().unwrap();

    // When
    let result = run(
        "test_report_schema_file",
        &["oxy", "report", "schema", "-o", target],
    );

    // Then
    assert!(matches!(result, Ok(CliOutput::Success(_))));
    let written = fs::read_to_string(&target_file).expect("schema file must exist");
    assert_eq!(written, report_json_schema().unwrap());
}

#[test]
fn test_given_machine_flag_and_output_path_when_report_schema_invoked_then_outputs_a_json_summary()
{
    // Given
    let temp_dir = tempfile::tempdir().expect("temp dir creation");
    let target_file = temp_dir.path().join("report.schema.json");
    let target = target_file.to_str().unwrap();

    // When
    let result = run(
        "test_report_schema_machine_file",
        &["oxy", "-m", "report", "schema", "-o", target],
    );

    // Then
    match result.expect("command must succeed") {
        CliOutput::Json(ref json_str) => {
            let parsed: Value = serde_json::from_str(json_str).unwrap();
            assert_eq!(parsed["status"], "success");
            assert_eq!(parsed["schema"], "oxy.report");
            assert_eq!(parsed["schema_version"], 2);
            assert_eq!(parsed["exported_path"], target);
        }
        other => panic!("expected CliOutput::Json, got: {other:?}"),
    }
}

#[test]
fn test_given_xml_format_when_report_schema_invoked_then_prints_the_xsd_of_the_xml_export() {
    // When
    let result = run(
        "test_report_schema_xml",
        &["oxy", "report", "schema", "--format", "xml"],
    );

    // Then
    match result.expect("command must succeed") {
        CliOutput::Raw(content) => assert_eq!(content, REPORT_XML_SCHEMA_V1),
        other => panic!("expected CliOutput::Raw, got: {other:?}"),
    }
}

#[test]
fn test_given_xml_format_and_output_path_when_report_schema_invoked_then_writes_the_xsd_file() {
    // Given
    let temp_dir = tempfile::tempdir().expect("temp dir creation");
    let target_file = temp_dir.path().join("report.xsd");
    let target = target_file.to_str().unwrap();

    // When
    let result = run(
        "test_report_schema_xml_file",
        &["oxy", "report", "schema", "--format", "xml", "-o", target],
    );

    // Then
    match result.expect("command must succeed") {
        CliOutput::Success(message) => assert!(message.contains("Exported XML schema v1 to")),
        other => panic!("expected CliOutput::Success, got: {other:?}"),
    }
    assert_eq!(
        fs::read_to_string(&target_file).unwrap(),
        REPORT_XML_SCHEMA_V1
    );
}

#[test]
fn test_given_machine_flag_xml_format_and_output_path_when_report_schema_invoked_then_outputs_a_json_summary(
) {
    // Given
    let temp_dir = tempfile::tempdir().expect("temp dir creation");
    let target_file = temp_dir.path().join("report.xsd");
    let target = target_file.to_str().unwrap();

    // When
    let result = run(
        "test_report_schema_xml_machine_file",
        &[
            "oxy", "-m", "report", "schema", "--format", "xml", "-o", target,
        ],
    );

    // Then
    match result.expect("command must succeed") {
        CliOutput::Json(ref json_str) => {
            let parsed: Value = serde_json::from_str(json_str).unwrap();
            assert_eq!(parsed["status"], "success");
            assert_eq!(parsed["schema"], "XML");
            assert_eq!(parsed["schema_version"], 1);
            assert_eq!(parsed["exported_path"], target);
        }
        other => panic!("expected CliOutput::Json, got: {other:?}"),
    }
}

#[test]
fn test_given_xml_format_and_envelope_target_when_report_schema_invoked_then_returns_a_syntax_error(
) {
    // When
    let result = run(
        "test_report_schema_envelope_xml",
        &[
            "oxy", "report", "schema", "--format", "xml", "--target", "envelope",
        ],
    );

    // Then
    let err = result.expect_err("the envelope has no XSD");
    assert_eq!(err.exit_code(), 2);
    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "CLI_SYNTAX_INVALID_ARGS");
    assert!(envelope.technical.contains("--format json"));
}

#[test]
fn test_given_xml_format_envelope_target_and_output_path_when_report_schema_invoked_then_no_file_is_written(
) {
    // Given
    let temp_dir = tempfile::tempdir().expect("temp dir creation");
    let target_file = temp_dir.path().join("envelope.xsd");
    let target = target_file.to_str().unwrap();

    // When
    let result = run(
        "test_report_schema_envelope_xml_file",
        &[
            "oxy", "report", "schema", "--format", "xml", "--target", "envelope", "-o", target,
        ],
    );

    // Then
    assert!(result.is_err());
    assert!(!target_file.exists());
}
