use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;

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

#[test]
fn test_given_configured_persistence_when_config_get_non_existent_key_then_fails_with_entity_error_exit_code_4(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_config_not_found");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let get_args = CliArgs::try_parse_from(["oxy", "config", "get", "unknown_key_xyz"]).unwrap();

    // When
    let result = handle_cli(get_args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 4);
    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "DOM_ENTITY_NOT_FOUND");
    assert!(envelope
        .technical
        .contains("Config key 'unknown_key_xyz' not found"));
}

#[test]
fn test_given_configured_persistence_when_config_list_in_machine_mode_then_returns_clean_json_map()
{
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_config_ls_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    persistence
        .cli
        .set_config_value("theme", "cyberpunk")
        .unwrap();

    let list_args = CliArgs::try_parse_from(["oxy", "--machine", "config", "ls"]).unwrap();

    // When
    let result = handle_cli(list_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON map");
    assert!(parsed.is_object());
    assert_eq!(parsed["theme"], "cyberpunk");
}

#[test]
fn test_given_configured_persistence_when_config_get_in_machine_mode_then_returns_clean_json() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_config_get_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    persistence.cli.set_config_value("editor", "nano").unwrap();

    let get_args = CliArgs::try_parse_from(["oxy", "--json", "config", "get", "editor"]).unwrap();

    // When
    let result = handle_cli(get_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON object");
    assert_eq!(parsed["key"], "editor");
    assert_eq!(parsed["value"], "nano");
}

#[test]
fn test_given_configured_persistence_when_config_set_in_machine_mode_then_returns_clean_json() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_config_set_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let set_args =
        CliArgs::try_parse_from(["oxy", "--machine", "config", "set", "locale", "pl"]).unwrap();

    // When
    let result = handle_cli(set_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON object");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["key"], "locale");
    assert_eq!(parsed["value"], "pl");
}

#[test]
fn test_given_configured_persistence_when_setting_valid_cli_machine_locale_then_persists_and_gets()
{
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_subsystem_cli_machine_locale_valid");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    // When setting valid locale 'de'
    let set_args =
        CliArgs::try_parse_from(["oxy", "config", "set", "cli_machine_locale", "de"]).unwrap();
    let set_result = handle_cli(set_args, &persistence, &engine);

    // Then
    assert!(set_result.is_ok());

    let get_args = CliArgs::try_parse_from(["oxy", "config", "get", "cli_machine_locale"]).unwrap();
    let get_result = handle_cli(get_args, &persistence, &engine).unwrap();
    assert!(format!("{}", get_result).contains("de"));

    let val_in_db = persistence
        .cli
        .get_config_value("cli_machine_locale")
        .unwrap();
    assert_eq!(val_in_db.as_deref(), Some("de"));

    // Verify all supported locales can be set
    let supported = [
        "pl", "en", "de", "es", "pt-br", "fr", "uk", "ja", "nl", "it",
    ];
    for loc in supported {
        let args =
            CliArgs::try_parse_from(["oxy", "config", "set", "cli_machine_locale", loc]).unwrap();
        assert!(handle_cli(args, &persistence, &engine).is_ok());
        let resolved = oxyflow_timelog::cli::resolve_machine_locale(&persistence).unwrap();
        assert_eq!(resolved, loc);
    }
}

#[test]
fn test_given_configured_persistence_when_setting_invalid_cli_machine_locale_then_fails_with_syntax_error(
) {
    // Given
    let (_conn, config, _temp) =
        setup_persistence_test("test_subsystem_cli_machine_locale_invalid");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    // Explicitly reject system
    let args_system =
        CliArgs::try_parse_from(["oxy", "config", "set", "cli_machine_locale", "system"]).unwrap();
    let res_system = handle_cli(args_system, &persistence, &engine);
    assert!(res_system.is_err());
    let err_system = res_system.unwrap_err();
    assert_eq!(err_system.exit_code(), 2);
    let env_system = err_system.to_envelope(None);
    assert_eq!(env_system.code, "CLI_SYNTAX_INVALID_ARGS");

    // Explicitly reject custom
    let args_custom =
        CliArgs::try_parse_from(["oxy", "config", "set", "cli_machine_locale", "custom"]).unwrap();
    let res_custom = handle_cli(args_custom, &persistence, &engine);
    assert!(res_custom.is_err());
    let err_custom = res_custom.unwrap_err();
    assert_eq!(err_custom.exit_code(), 2);
    let env_custom = err_custom.to_envelope(None);
    assert_eq!(env_custom.code, "CLI_SYNTAX_INVALID_ARGS");

    // Reject unknown string
    let args_unknown =
        CliArgs::try_parse_from(["oxy", "config", "set", "cli_machine_locale", "klingon"]).unwrap();
    let res_unknown = handle_cli(args_unknown, &persistence, &engine);
    assert!(res_unknown.is_err());
    let err_unknown = res_unknown.unwrap_err();
    assert_eq!(err_unknown.exit_code(), 2);
}

#[test]
fn test_given_unset_cli_machine_locale_when_resolved_or_get_then_defaults_to_en() {
    // Given
    let (_conn, config, _temp) =
        setup_persistence_test("test_subsystem_cli_machine_locale_default");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    // When unset, resolve_machine_locale must return "en"
    let resolved = oxyflow_timelog::cli::resolve_machine_locale(&persistence).unwrap();
    assert_eq!(resolved, "en");

    // Getting unset cli_machine_locale returns documented default "en"
    let get_args = CliArgs::try_parse_from(["oxy", "config", "get", "cli_machine_locale"]).unwrap();
    let get_result = handle_cli(get_args, &persistence, &engine).unwrap();
    assert!(format!("{}", get_result).contains("en"));

    // Machine mode get returns json with default "en"
    let get_m_args =
        CliArgs::try_parse_from(["oxy", "--machine", "config", "get", "cli_machine_locale"])
            .unwrap();
    let get_m_result = handle_cli(get_m_args, &persistence, &engine).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&format!("{}", get_m_result)).unwrap();
    assert_eq!(parsed["key"], "cli_machine_locale");
    assert_eq!(parsed["value"], "en");
}

#[test]
fn test_given_corrupted_cli_machine_locale_in_db_when_config_get_then_fails_with_typed_syntax_error() {
    // Given
    let (_conn, config, _temp) =
        setup_persistence_test("test_subsystem_cli_machine_locale_corrupted_get");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    // Corrupted arbitrary value in SQLite
    persistence
        .cli
        .set_config_value("cli_machine_locale", "corrupted_klingon")
        .unwrap();

    let get_args =
        CliArgs::try_parse_from(["oxy", "config", "get", "cli_machine_locale"]).unwrap();
    let res = handle_cli(get_args, &persistence, &engine);
    assert!(res.is_err());
    let err = res.unwrap_err();
    assert_eq!(err.exit_code(), 2);
    let env = err.to_envelope(None);
    assert_eq!(env.code, "CLI_SYNTAX_INVALID_ARGS");

    // "system" stored directly in SQLite
    persistence
        .cli
        .set_config_value("cli_machine_locale", "system")
        .unwrap();
    let res_system = handle_cli(
        CliArgs::try_parse_from(["oxy", "config", "get", "cli_machine_locale"]).unwrap(),
        &persistence,
        &engine,
    );
    assert!(res_system.is_err());
    let err_system = res_system.unwrap_err();
    assert_eq!(err_system.exit_code(), 2);
    assert_eq!(err_system.to_envelope(None).code, "CLI_SYNTAX_INVALID_ARGS");

    // "custom" stored directly in SQLite
    persistence
        .cli
        .set_config_value("cli_machine_locale", "custom")
        .unwrap();
    let res_custom = handle_cli(
        CliArgs::try_parse_from(["oxy", "config", "get", "cli_machine_locale"]).unwrap(),
        &persistence,
        &engine,
    );
    assert!(res_custom.is_err());
    let err_custom = res_custom.unwrap_err();
    assert_eq!(err_custom.exit_code(), 2);
    assert_eq!(err_custom.to_envelope(None).code, "CLI_SYNTAX_INVALID_ARGS");

    // Valid value stored in SQLite
    persistence
        .cli
        .set_config_value("cli_machine_locale", "de")
        .unwrap();
    let res_valid = handle_cli(
        CliArgs::try_parse_from(["oxy", "config", "get", "cli_machine_locale"]).unwrap(),
        &persistence,
        &engine,
    );
    assert!(res_valid.is_ok());
    assert!(format!("{}", res_valid.unwrap()).contains("de"));
}

#[test]
fn test_given_configured_persistence_when_gui_locale_set_then_cli_machine_locale_remains_independent(
) {
    // Given
    let (_conn, config, _temp) =
        setup_persistence_test("test_subsystem_cli_machine_locale_independent");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    // Set GUI locale preference to Polish
    persistence
        .locale
        .save_locale_pref("pl".to_string())
        .unwrap();
    persistence.locale.save_locale("pl".to_string()).unwrap();

    // CLI machine locale must still resolve to default "en"
    let cli_locale = oxyflow_timelog::cli::resolve_machine_locale(&persistence).unwrap();
    assert_eq!(cli_locale, "en");

    // Now set CLI machine locale to German
    let set_cli_args =
        CliArgs::try_parse_from(["oxy", "config", "set", "cli_machine_locale", "de"]).unwrap();
    assert!(handle_cli(set_cli_args, &persistence, &engine).is_ok());

    // Verify GUI preferences remain completely unchanged
    assert_eq!(persistence.locale.get_locale_pref().unwrap(), "pl");
    assert_eq!(persistence.locale.get_locale().unwrap(), "pl");

    // Verify CLI machine locale is German
    assert_eq!(
        oxyflow_timelog::cli::resolve_machine_locale(&persistence).unwrap(),
        "de"
    );
}

#[test]
fn test_given_custom_machine_locale_configured_when_cli_error_in_machine_mode_then_envelope_is_backward_compatible(
) {
    // Given
    let (_conn, config, _temp) =
        setup_persistence_test("test_subsystem_cli_machine_locale_envelope");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    // Set cli_machine_locale to 'ja'
    persistence
        .cli
        .set_config_value("cli_machine_locale", "ja")
        .unwrap();

    // Trigger an entity not found error in machine mode
    let start_args =
        CliArgs::try_parse_from(["oxy", "--machine", "start", "nonexistent-task-abc"]).unwrap();
    let result = handle_cli(start_args, &persistence, &engine);

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 4);

    let resolved_locale = oxyflow_timelog::cli::resolve_machine_locale(&persistence).unwrap();
    assert_eq!(resolved_locale, "ja");

    let envelope = err.to_envelope_with_mode(true, Some(&resolved_locale));
    let json_str = serde_json::to_string(&envelope).expect("valid serialization");
    let parsed: serde_json::Value = serde_json::from_str(&json_str).expect("valid json parse");

    // Invariant contracts: exact field names and types
    assert_eq!(parsed["code"], "DOM_ENTITY_NOT_FOUND");
    assert_eq!(parsed["category"], "entity");
    assert_eq!(parsed["exit_code"], 4);
    assert!(parsed["timestamp"].is_string());
    assert!(parsed["technical"].is_string());
    // In machine mode, user is None and omitted from serialized json
    assert!(parsed.get("user").is_none());
}

#[test]
fn test_given_multiple_databases_when_cli_machine_locale_configured_then_respects_active_database()
{
    // Given two isolated databases
    let (_conn1, config1, _temp1) = setup_persistence_test("test_cli_machine_locale_db1");
    let (_conn2, config2, _temp2) = setup_persistence_test("test_cli_machine_locale_db2");

    let persistence1 = Persistence::new(&config1).unwrap();
    let persistence2 = Persistence::new(&config2).unwrap();

    // Set db1 to 'de' and db2 to 'fr'
    persistence1
        .cli
        .set_config_value("cli_machine_locale", "de")
        .unwrap();
    persistence2
        .cli
        .set_config_value("cli_machine_locale", "fr")
        .unwrap();

    // Verify each resolves to its own active DB configuration
    assert_eq!(
        oxyflow_timelog::cli::resolve_machine_locale(&persistence1).unwrap(),
        "de"
    );
    assert_eq!(
        oxyflow_timelog::cli::resolve_machine_locale(&persistence2).unwrap(),
        "fr"
    );
}
