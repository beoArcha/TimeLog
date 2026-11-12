use crate::e2e::support::{execute_oxy_with_timeout, TempEnvDir};
use serde_json::Value;
use std::time::Duration;

const OXY_TIMEOUT: Duration = Duration::from_secs(20);

#[test]
fn test_given_the_binary_when_report_schema_then_stdout_is_one_json_schema_and_stderr_is_empty() {
    // Given
    let temp_env = TempEnvDir::new("oxy_report_schema");

    // When
    let output = execute_oxy_with_timeout(&temp_env, &["report", "schema"], OXY_TIMEOUT);

    // Then
    assert!(output.status.success());
    assert!(output.stderr.is_empty(), "stderr must stay empty");
    let schema: Value =
        serde_json::from_slice(&output.stdout).expect("stdout must be a single JSON document");
    assert_eq!(
        schema["$schema"],
        "https://json-schema.org/draft/2020-12/schema"
    );
    assert_eq!(schema["properties"]["schema"]["const"], "oxy.report");
}

#[test]
fn test_given_machine_mode_when_report_schema_then_stdout_is_still_pure_json() {
    // Given
    let temp_env = TempEnvDir::new("oxy_report_schema_machine");

    // When
    let output = execute_oxy_with_timeout(&temp_env, &["-m", "report", "schema"], OXY_TIMEOUT);

    // Then
    assert!(output.status.success());
    let schema: Value = serde_json::from_slice(&output.stdout).expect("pure JSON on stdout");
    assert_eq!(schema["$id"], "urn:oxyflow:schema:oxy.report:2");
}

#[test]
fn test_given_the_binary_when_report_schema_with_xml_format_then_exits_with_syntax_error_code() {
    // Given
    let temp_env = TempEnvDir::new("oxy_report_schema_xml");

    // When
    let output = execute_oxy_with_timeout(
        &temp_env,
        &["report", "schema", "--format", "xml"],
        OXY_TIMEOUT,
    );

    // Then
    assert_eq!(output.status.code(), Some(2));
    assert!(output.stdout.is_empty(), "failure must not print on stdout");
    assert!(String::from_utf8_lossy(&output.stderr).contains("CLI_SYNTAX_INVALID_ARGS"));
}
