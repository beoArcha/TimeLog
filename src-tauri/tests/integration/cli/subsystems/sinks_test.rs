use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::{handle_cli, CliArgs};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use std::fs;

#[test]
fn test_given_configured_persistence_when_setting_csv_sink_then_persists_and_emits_records() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_sinks_csv");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let temp_csv_dir =
        std::env::temp_dir().join(format!("test_csv_sink_dir_{}", uuid::Uuid::new_v4()));
    let temp_csv_str = temp_csv_dir.to_str().unwrap();

    let set_args =
        CliArgs::try_parse_from(["oxy", "sink", "set-csv", "--dir", temp_csv_str]).unwrap();

    // When
    let set_result = handle_cli(set_args, &persistence, &engine);

    // Then
    assert!(set_result.is_ok(), "Setting CSV sink should succeed");
    assert!(temp_csv_dir.exists(), "CSV sink directory must be created");

    let list_args = CliArgs::try_parse_from(["oxy", "sink", "ls"]).unwrap();
    let list_result = handle_cli(list_args, &persistence, &engine).unwrap();
    let output_str = format!("{}", list_result);
    assert!(output_str.contains("csv"));
    assert!(output_str.contains(temp_csv_str));

    let _ = fs::remove_dir_all(&temp_csv_dir);
}

#[test]
fn test_given_configured_persistence_when_setting_webhook_sink_and_testing_then_verifies_health() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_sinks_webhook");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let set_args = CliArgs::try_parse_from([
        "oxy",
        "sink",
        "set-webhook",
        "--url",
        "https://webhook.site/integration-test",
        "--token",
        "bearer-test-token-123",
    ])
    .unwrap();

    // When
    let set_result = handle_cli(set_args, &persistence, &engine);

    // Then
    assert!(set_result.is_ok(), "Setting webhook sink should succeed");

    let test_args = CliArgs::try_parse_from(["oxy", "sink", "test"]).unwrap();
    let test_result = handle_cli(test_args, &persistence, &engine).unwrap();
    let output_str = format!("{}", test_result);
    assert!(output_str.contains("webhook"));
    assert!(output_str.contains("healthy"));

    let sink = persistence
        .cli
        .get_sink("webhook")
        .unwrap()
        .expect("Webhook sink must be persisted");
    assert_eq!(sink.target, "https://webhook.site/integration-test");
    assert!(sink.config.unwrap().contains("bearer-test-token-123"));
}

#[test]
fn test_given_unhealthy_sink_when_testing_sinks_then_fails_with_exit_code_1_and_snk_external_io() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_sinks_unhealthy");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let bad_sink = oxy_flow::types::CliSink {
        name: "bad_webhook".to_string(),
        sink_type: "webhook".to_string(),
        target: "ftp://unsupported.domain/hook".to_string(),
        config: None,
        enabled: true,
        created_at: oxy_flow::cli::shared::utils::current_timestamp(),
    };
    persistence.cli.save_sink(&bad_sink).unwrap();

    let test_args = CliArgs::try_parse_from(["oxy", "sink", "test"]).unwrap();

    // When
    let test_result = handle_cli(test_args, &persistence, &engine);

    // Then
    assert!(
        test_result.is_err(),
        "Sink test must fail on unhealthy sink"
    );
    let err = test_result.unwrap_err();
    assert_eq!(err.exit_code(), 1, "Failed sink test must exit with code 1");
    assert_eq!(
        err.error_code(),
        oxy_flow::cli::error::CliErrorCode::SnkExternalIo
    );
}

#[test]
fn test_given_configured_persistence_when_setting_csv_sink_in_machine_mode_then_returns_clean_json()
{
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_sinks_csv_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let temp_csv_dir =
        std::env::temp_dir().join(format!("test_csv_sink_mach_{}", uuid::Uuid::new_v4()));
    let temp_csv_str = temp_csv_dir.to_str().unwrap();

    let set_args =
        CliArgs::try_parse_from(["oxy", "--machine", "sink", "set-csv", "--dir", temp_csv_str])
            .unwrap();

    // When
    let result = handle_cli(set_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON object");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["sink"], "csv");

    let _ = fs::remove_dir_all(&temp_csv_dir);
}

#[test]
fn test_given_configured_persistence_when_listing_sinks_in_machine_mode_then_returns_clean_json_array(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_sinks_ls_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let list_args = CliArgs::try_parse_from(["oxy", "--machine", "sink", "ls"]).unwrap();

    // When
    let result = handle_cli(list_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON array");
    assert!(parsed.is_array());
}

#[test]
fn test_given_configured_persistence_when_setting_webhook_sink_in_machine_mode_then_returns_clean_json(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_sinks_webhook_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let set_args = CliArgs::try_parse_from([
        "oxy",
        "--json",
        "sink",
        "set-webhook",
        "--url",
        "https://example.com/test-endpoint",
        "--token",
        "secret-token",
    ])
    .unwrap();

    // When
    let result = handle_cli(set_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON object");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["sink"], "webhook");
    assert_eq!(parsed["target"], "https://example.com/test-endpoint");
}
