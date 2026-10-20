use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::handlers::mask_handler::expand_mask_template;
use oxy_flow::cli::{handle_cli, CliArgs, CliOutput};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_configured_persistence_when_sink_set_csv_and_list_executed_then_persists_sink() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_sink_csv");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let temp_csv = std::env::temp_dir().join(format!("test_csv_sink_{}", uuid::Uuid::new_v4()));
    let temp_csv_str = temp_csv.to_str().unwrap();

    let set_args =
        CliArgs::try_parse_from(["oxy", "sink", "set-csv", "--dir", temp_csv_str]).unwrap();

    // When
    let set_result = handle_cli(set_args, &persistence, &engine);

    // Then
    assert!(set_result.is_ok());
    let list_args = CliArgs::try_parse_from(["oxy", "sink", "ls"]).unwrap();
    let list_result = handle_cli(list_args, &persistence, &engine).unwrap();
    let output_str = format!("{}", list_result);
    assert!(output_str.contains("csv"));
    assert!(output_str.contains(temp_csv_str));

    let _ = std::fs::remove_dir_all(&temp_csv);
}

#[test]
fn test_given_configured_persistence_when_sink_set_webhook_and_test_executed_then_reports_status() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_sink_webhook");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let set_args = CliArgs::try_parse_from([
        "oxy",
        "sink",
        "set-webhook",
        "--url",
        "https://webhook.site/test-uuid",
        "--token",
        "secret-token",
    ])
    .unwrap();

    // When
    let set_result = handle_cli(set_args, &persistence, &engine);

    // Then
    assert!(set_result.is_ok());

    let test_args = CliArgs::try_parse_from(["oxy", "sink", "test"]).unwrap();
    let test_result = handle_cli(test_args, &persistence, &engine).unwrap();
    let output_str = format!("{}", test_result);
    assert!(output_str.contains("webhook"));
    assert!(output_str.contains("healthy"));
}

#[test]
fn test_given_configured_persistence_when_mask_set_and_list_executed_then_macro_is_registered() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_mask_crud");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let set_args = CliArgs::try_parse_from([
        "oxy",
        "mask",
        "set",
        "standup",
        "log add meetings 15m \"Daily sync\"",
    ])
    .unwrap();

    // When
    let set_result = handle_cli(set_args, &persistence, &engine);

    // Then
    assert!(set_result.is_ok());

    let list_args = CliArgs::try_parse_from(["oxy", "mask", "ls"]).unwrap();
    let list_result = handle_cli(list_args, &persistence, &engine).unwrap();
    let output_str = format!("{}", list_result);
    assert!(output_str.contains("standup"));
    assert!(output_str.contains("Daily sync"));
}

#[test]
fn test_given_registered_mask_when_remove_invoked_then_mask_is_deleted() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_mask_rm");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let set_args = CliArgs::try_parse_from(["oxy", "mask", "set", "wrapup", "stop --all"]).unwrap();
    handle_cli(set_args, &persistence, &engine).unwrap();

    let rm_args = CliArgs::try_parse_from(["oxy", "mask", "rm", "wrapup"]).unwrap();

    // When
    let rm_result = handle_cli(rm_args, &persistence, &engine);

    // Then
    assert!(rm_result.is_ok());

    let list_args = CliArgs::try_parse_from(["oxy", "mask", "ls"]).unwrap();
    let list_result = handle_cli(list_args, &persistence, &engine).unwrap();
    let output_str = format!("{}", list_result);
    assert!(!output_str.contains("wrapup"));
}

#[test]
fn test_given_configured_persistence_when_config_set_and_get_invoked_then_persists_key_value() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_config_kv");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let set_args =
        CliArgs::try_parse_from(["oxy", "config", "set", "custom_format", "iso8601"]).unwrap();

    // When
    let set_result = handle_cli(set_args, &persistence, &engine);

    // Then
    assert!(set_result.is_ok());

    let get_args = CliArgs::try_parse_from(["oxy", "config", "get", "custom_format"]).unwrap();
    let get_result = handle_cli(get_args, &persistence, &engine).unwrap();
    match get_result {
        CliOutput::Success(val) => assert_eq!(val, "iso8601"),
        _ => panic!("Expected Success output with config value"),
    }
}

#[test]
fn test_given_mask_template_with_tokens_when_expanded_then_replaces_parameters_and_last_task() {
    // Given
    let template = "log add $1 $2 \"Worked on $LAST_TASK\"";
    let args = vec!["core_proj".to_string(), "30m".to_string()];
    let last_task = Some("task_123");

    // When
    let expanded = expand_mask_template(template, &args, last_task);

    // Then
    assert_eq!(expanded, "log add core_proj 30m \"Worked on task_123\"");
}
