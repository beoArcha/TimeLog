use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxyflow_timelog::cli::exporters::REPORT_XML_SCHEMA_V1;
use oxyflow_timelog::cli::{handle_cli, CliArgs, CliOutput};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use std::fs;

#[test]
fn test_given_no_flag_when_report_schema_invoked_then_outputs_canonical_xsd_to_stdout() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_report_schema_stdout");
    let persistence = Persistence::new(&config).expect("persistence layer setup");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "report", "schema"]).expect("valid CLI command");

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok(), "command must succeed: {:?}", result.err());
    let output = result.unwrap();
    match output {
        CliOutput::Raw(ref content) => {
            assert_eq!(
                content, REPORT_XML_SCHEMA_V1,
                "schema output must match canonical REPORT_XML_SCHEMA_V1 byte-for-byte"
            );
        }
        other => panic!(
            "expected CliOutput::Raw with schema string, got: {:?}",
            other
        ),
    }

    // Verify Display trait outputs raw XML string for clean stdout redirection
    assert_eq!(output.to_string(), REPORT_XML_SCHEMA_V1);
}

#[test]
fn test_given_output_path_when_report_schema_invoked_then_creates_identical_file() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_report_schema_file");
    let persistence = Persistence::new(&config).expect("persistence layer setup");
    let engine = Engine::new(&persistence);
    let temp_dir = tempfile::tempdir().expect("temp dir creation");
    let target_file = temp_dir.path().join("schemas").join("report-v1.xsd");
    let target_path_str = target_file.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "report", "schema", "-o", target_path_str])
        .expect("valid CLI command with -o");

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(
        result.is_ok(),
        "file export must succeed: {:?}",
        result.err()
    );
    assert!(
        target_file.exists(),
        "target schema file must exist on disk"
    );

    let file_content = fs::read_to_string(&target_file).expect("read schema file");
    assert_eq!(
        file_content, REPORT_XML_SCHEMA_V1,
        "exported file content must be identical to REPORT_XML_SCHEMA_V1"
    );
}

#[test]
fn test_given_output_path_with_long_flag_when_report_schema_invoked_then_creates_identical_file() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_report_schema_long_flag");
    let persistence = Persistence::new(&config).expect("persistence layer setup");
    let engine = Engine::new(&persistence);
    let temp_dir = tempfile::tempdir().expect("temp dir creation");
    let target_file = temp_dir.path().join("report.xsd");
    let target_path_str = target_file.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "report", "schema", "--output", target_path_str])
        .expect("valid CLI command with --output");

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    assert!(target_file.exists());

    let file_content = fs::read_to_string(&target_file).expect("read schema file");
    assert_eq!(file_content, REPORT_XML_SCHEMA_V1);
}

#[test]
fn test_given_unsupported_version_when_report_schema_invoked_then_returns_syntax_error() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_report_schema_unsupported_version");
    let persistence = Persistence::new(&config).expect("persistence layer setup");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "report", "schema", "--version", "2"])
        .expect("valid CLI parsing of version flag");

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_err(), "unsupported version must produce error");
    let err = result.unwrap_err();

    // Verify syntax error classification and non-zero exit code (exit code 2 for syntax errors)
    assert_ne!(err.exit_code(), 0, "exit code must be non-zero");
    assert_eq!(err.exit_code(), 2, "syntax error must have exit code 2");

    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "CLI_SYNTAX_INVALID_ARGS");
    assert!(envelope
        .technical
        .contains("Unsupported XML schema version: '2'"));
    assert!(envelope.technical.contains("Supported versions: '1'"));
}

#[test]
fn test_given_machine_flag_and_output_path_when_report_schema_invoked_then_outputs_json_envelope() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_report_schema_machine");
    let persistence = Persistence::new(&config).expect("persistence layer setup");
    let engine = Engine::new(&persistence);
    let temp_dir = tempfile::tempdir().expect("temp dir creation");
    let target_file = temp_dir.path().join("report-v1.xsd");
    let target_path_str = target_file.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "-m", "report", "schema", "-o", target_path_str])
        .expect("valid CLI command");

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    match result.unwrap() {
        CliOutput::Json(ref json_str) => {
            let parsed: serde_json::Value = serde_json::from_str(json_str).unwrap();
            assert_eq!(parsed["status"], "success");
            assert_eq!(parsed["schema_version"], "1");
            assert_eq!(parsed["exported_path"], target_path_str);
        }
        other => panic!("expected CliOutput::Json, got: {:?}", other),
    }
}
