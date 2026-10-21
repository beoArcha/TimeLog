use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::{handle_cli, CliArgs};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_configured_persistence_when_config_set_and_get_invoked_then_persists_key_value() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_config_kv");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let set_args = CliArgs::try_parse_from(["oxy", "config", "set", "ui_theme", "dark"]).unwrap();

    // When
    let set_result = handle_cli(set_args, &persistence, &engine);

    // Then
    assert!(set_result.is_ok());

    let get_args = CliArgs::try_parse_from(["oxy", "config", "get", "ui_theme"]).unwrap();
    let get_result = handle_cli(get_args, &persistence, &engine).unwrap();
    let output_str = format!("{}", get_result);
    assert!(output_str.contains("dark"));

    let val_in_db = persistence.cli.get_config_value("ui_theme").unwrap();
    assert_eq!(val_in_db.as_deref(), Some("dark"));
}

#[test]
fn test_given_configured_persistence_when_config_list_invoked_then_displays_all_entries() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_config_ls");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    persistence.cli.set_config_value("editor", "vim").unwrap();

    let list_args = CliArgs::try_parse_from(["oxy", "config", "ls"]).unwrap();

    // When
    let list_result = handle_cli(list_args, &persistence, &engine);

    // Then
    assert!(list_result.is_ok());
    let output_str = format!("{}", list_result.unwrap());
    assert!(output_str.contains("editor"));
    assert!(output_str.contains("vim"));
}
