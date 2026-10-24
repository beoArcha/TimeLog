use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::{handle_cli, CliArgs};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_healthy_database_when_doctor_invoked_then_reports_all_checks_passed() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_doctor_healthy");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let args = CliArgs::try_parse_from(["oxy", "doctor"]).expect("Parse doctor args");

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let output = format!("{}", result.expect("Result ok"));
    assert!(output.contains("[OK]"));
    assert!(output.contains("All diagnostic checks passed successfully"));
}

#[test]
fn test_given_healthy_database_when_doctor_machine_invoked_then_outputs_valid_json() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_doctor_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let args = CliArgs::try_parse_from(["oxy", "doctor", "--machine"]).expect("Parse doctor args");

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let output = format!("{}", result.expect("Result ok"));
    let parsed: serde_json::Value =
        serde_json::from_str(&output).expect("Output must be valid JSON");
    assert_eq!(parsed["overall_status"], "ok");
    assert!(parsed["checks"].is_array());
    assert!(!parsed["checks"]
        .as_array()
        .expect("Checks array")
        .is_empty());
}
