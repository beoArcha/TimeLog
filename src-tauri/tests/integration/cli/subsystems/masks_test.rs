use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::handlers::mask_handler::expand_mask_template;
use oxy_flow::cli::{handle_cli, CliArgs};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

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

    let set_args =
        CliArgs::try_parse_from(["oxy", "mask", "set", "temp_alias", "start core"]).unwrap();
    handle_cli(set_args, &persistence, &engine).unwrap();

    let rm_args = CliArgs::try_parse_from(["oxy", "mask", "rm", "temp_alias"]).unwrap();

    // When
    let rm_result = handle_cli(rm_args, &persistence, &engine);

    // Then
    assert!(rm_result.is_ok());
    let alias = persistence.cli.get_alias("temp_alias").unwrap();
    assert!(alias.is_none());
}

#[test]
fn test_given_mask_template_with_tokens_when_expanded_then_replaces_parameters_and_last_task() {
    // Given
    let template = "log add $LAST_TASK $1 \"$2\"";
    let args = vec!["30m".to_string(), "Code Review".to_string()];
    let last_task = Some("t-refactor-99");

    // When
    let expanded = expand_mask_template(template, &args, last_task);

    // Then
    assert_eq!(expanded, "log add t-refactor-99 30m \"Code Review\"");
}
