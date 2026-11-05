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
fn test_given_corrupted_cli_machine_locale_in_db_when_config_get_then_fails_with_typed_syntax_error(
) {
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

    let get_args = CliArgs::try_parse_from(["oxy", "config", "get", "cli_machine_locale"]).unwrap();
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

#[test]
fn test_given_different_db_flags_when_commands_executed_then_resolves_and_applies_respective_database_end_to_end(
) {
    use oxyflow_timelog::commands::cli::execute_command_string;

    // Given two distinct isolated databases
    let (_conn_a, config_a, _temp_a) = setup_persistence_test("test_cli_db_flag_a");
    let (_conn_b, config_b, _temp_b) = setup_persistence_test("test_cli_db_flag_b");

    let persistence_a = Persistence::new(&config_a).expect("init db a");
    let persistence_b = Persistence::new(&config_b).expect("init db b");

    // 1. Create temp DB A with cli_machine_locale = "de"
    persistence_a
        .cli
        .set_config_value("cli_machine_locale", "de")
        .unwrap();

    // 2. Create temp DB B with cli_machine_locale = "ja"
    persistence_b
        .cli
        .set_config_value("cli_machine_locale", "ja")
        .unwrap();

    let db_a_str = config_a.db_path.to_str().unwrap();
    let db_b_str = config_b.db_path.to_str().unwrap();

    // Fallback/dummy persistence that has default "en"
    let (_conn_dummy, config_dummy, _temp_dummy) = setup_persistence_test("test_cli_db_flag_dummy");
    let dummy_persistence = Persistence::new(&config_dummy).expect("init dummy");

    // 3. Verify passing --db <DB_A> loads DB A and resolves "de"
    let cmd_a = format!("oxy --db \"{}\" config get cli_machine_locale", db_a_str);
    let res_a = execute_command_string(&cmd_a, &dummy_persistence).expect("execute cmd with DB A");
    assert!(res_a.success);
    assert_eq!(res_a.exit_code, 0);
    assert!(res_a.stdout.contains("de"));

    let cmd_a_machine = format!(
        "oxy --machine --db \"{}\" config get cli_machine_locale",
        db_a_str
    );
    let res_a_m = execute_command_string(&cmd_a_machine, &dummy_persistence)
        .expect("execute machine cmd with DB A");
    assert!(res_a_m.success);
    let parsed_a: serde_json::Value =
        serde_json::from_str(&res_a_m.stdout).expect("valid json from DB A");
    assert_eq!(parsed_a["key"], "cli_machine_locale");
    assert_eq!(parsed_a["value"], "de");

    // Verify passing --db <DB_B> loads DB B and resolves "ja"
    let cmd_b = format!("oxy --db \"{}\" config get cli_machine_locale", db_b_str);
    let res_b = execute_command_string(&cmd_b, &dummy_persistence).expect("execute cmd with DB B");
    assert!(res_b.success);
    assert_eq!(res_b.exit_code, 0);
    assert!(res_b.stdout.contains("ja"));

    // Also verify --db=<path> syntax
    let cmd_b_eq = format!("oxy --db=\"{}\" config get cli_machine_locale", db_b_str);
    let res_b_eq =
        execute_command_string(&cmd_b_eq, &dummy_persistence).expect("execute cmd with DB B via =");
    assert!(res_b_eq.success);
    assert!(res_b_eq.stdout.contains("ja"));

    let cmd_b_machine = format!(
        "oxy --machine --db \"{}\" config get cli_machine_locale",
        db_b_str
    );
    let res_b_m = execute_command_string(&cmd_b_machine, &dummy_persistence)
        .expect("execute machine cmd with DB B");
    assert!(res_b_m.success);
    let parsed_b: serde_json::Value =
        serde_json::from_str(&res_b_m.stdout).expect("valid json from DB B");
    assert_eq!(parsed_b["key"], "cli_machine_locale");
    assert_eq!(parsed_b["value"], "ja");

    // Verify error handling in machine mode resolves machine locale from the respective database
    let cmd_err_a = format!(
        "oxy --machine --db \"{}\" start nonexistent-task-x",
        db_a_str
    );
    let err_res_a = execute_command_string(&cmd_err_a, &dummy_persistence).unwrap_err();
    assert_eq!(err_res_a.exit_code, 4);
    assert!(err_res_a.envelope.is_some());

    let cmd_err_b = format!(
        "oxy --machine --db \"{}\" start nonexistent-task-x",
        db_b_str
    );
    let err_res_b = execute_command_string(&cmd_err_b, &dummy_persistence).unwrap_err();
    assert_eq!(err_res_b.exit_code, 4);
    assert!(err_res_b.envelope.is_some());
}

#[test]
fn test_given_compiled_oxy_binary_process_when_executed_with_db_flags_then_respects_isolation_and_streams(
) {
    use rusqlite::Connection;
    use std::process::Command;

    let oxy_bin = env!("CARGO_BIN_EXE_oxy");

    let temp_dir =
        std::env::temp_dir().join(format!("timelog_oxy_bin_test_{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(&temp_dir).expect("create temp dir");

    let db_path_a = temp_dir.join("test_a.db");
    let db_path_b = temp_dir.join("test_b.db");

    // Initialize two distinct databases with different locales
    {
        let conn_a = Connection::open(&db_path_a).expect("open db a");
        oxyflow_timelog::repositories::shared::initialize_database(&conn_a).expect("init db a");
        conn_a
            .execute(
                "INSERT OR REPLACE INTO config (key, value) VALUES ('cli_machine_locale', 'de')",
                [],
            )
            .expect("set locale de");

        let conn_b = Connection::open(&db_path_b).expect("open db b");
        oxyflow_timelog::repositories::shared::initialize_database(&conn_b).expect("init db b");
        conn_b
            .execute(
                "INSERT OR REPLACE INTO config (key, value) VALUES ('cli_machine_locale', 'ja')",
                [],
            )
            .expect("set locale ja");
    }

    let db_a_str = db_path_a.to_str().unwrap();
    let db_b_str = db_path_b.to_str().unwrap();

    // 1. Test oxy --db <path> config get cli_machine_locale (human mode)
    let out_a = Command::new(oxy_bin)
        .args(["--db", db_a_str, "config", "get", "cli_machine_locale"])
        .output()
        .expect("run oxy --db a");
    assert_eq!(out_a.status.code(), Some(0));
    let stdout_a = String::from_utf8_lossy(&out_a.stdout);
    assert!(stdout_a.contains("de"));

    // 2. Test oxy --db=<path> config get cli_machine_locale (human mode with = syntax)
    let out_b = Command::new(oxy_bin)
        .arg(format!("--db={}", db_b_str))
        .args(["config", "get", "cli_machine_locale"])
        .output()
        .expect("run oxy --db=b");
    assert_eq!(out_b.status.code(), Some(0));
    let stdout_b = String::from_utf8_lossy(&out_b.stdout);
    assert!(stdout_b.contains("ja"));

    // 3. Test machine mode: --machine --db <path> config get cli_machine_locale
    let out_a_m = Command::new(oxy_bin)
        .args([
            "--machine",
            "--db",
            db_a_str,
            "config",
            "get",
            "cli_machine_locale",
        ])
        .output()
        .expect("run oxy machine a");
    assert_eq!(out_a_m.status.code(), Some(0));
    let stdout_a_m = String::from_utf8_lossy(&out_a_m.stdout);
    let parsed_a: serde_json::Value =
        serde_json::from_str(stdout_a_m.trim()).expect("valid json in machine mode");
    assert_eq!(parsed_a["key"], "cli_machine_locale");
    assert_eq!(parsed_a["value"], "de");
    // In successful machine mode, stderr must not contain error logs
    let stderr_a_m = String::from_utf8_lossy(&out_a_m.stderr);
    assert!(!stderr_a_m.contains("ERROR"));

    // 4. Test machine mode with --db=: --machine --db=<path> config get cli_machine_locale
    let out_b_m = Command::new(oxy_bin)
        .args([
            "--machine",
            &format!("--db={}", db_b_str),
            "config",
            "get",
            "cli_machine_locale",
        ])
        .output()
        .expect("run oxy machine b");
    assert_eq!(out_b_m.status.code(), Some(0));
    let stdout_b_m = String::from_utf8_lossy(&out_b_m.stdout);
    let parsed_b: serde_json::Value =
        serde_json::from_str(stdout_b_m.trim()).expect("valid json in machine mode");
    assert_eq!(parsed_b["key"], "cli_machine_locale");
    assert_eq!(parsed_b["value"], "ja");

    // 5. Test machine mode error handling and stream discipline (stderr has envelope, stdout clean)
    let out_err = Command::new(oxy_bin)
        .args([
            "--machine",
            "--db",
            db_a_str,
            "start",
            "nonexistent-task-abc",
        ])
        .output()
        .expect("run oxy start error");
    assert_eq!(out_err.status.code(), Some(4)); // DOM_ENTITY_NOT_FOUND exit code
    let stdout_err = String::from_utf8_lossy(&out_err.stdout);
    assert!(
        stdout_err.trim().is_empty(),
        "Machine mode stdout must be empty on error, got: {}",
        stdout_err
    );
    let stderr_err = String::from_utf8_lossy(&out_err.stderr);
    let envelope: serde_json::Value =
        serde_json::from_str(stderr_err.trim()).expect("stderr contains valid JSON envelope");
    assert_eq!(envelope["code"], "DOM_ENTITY_NOT_FOUND");
    assert_eq!(envelope["exit_code"], 4);

    // 6. Test Stage C error logging with real binary: corrupted locale in DB
    let db_path_c = temp_dir.join("test_c.db");
    {
        let conn_c = Connection::open(&db_path_c).expect("open db c");
        oxyflow_timelog::repositories::shared::initialize_database(&conn_c).expect("init db c");
        conn_c
            .execute(
                "INSERT OR REPLACE INTO config (key, value) VALUES ('cli_machine_locale', 'corrupted_val')",
                [],
            )
            .expect("set corrupted locale");
    }
    let db_c_str = db_path_c.to_str().unwrap();

    let out_corrupt = Command::new(oxy_bin)
        .args([
            "--machine",
            "--db",
            db_c_str,
            "start",
            "nonexistent-task-xyz",
        ])
        .output()
        .expect("run oxy corrupt locale");
    assert_eq!(out_corrupt.status.code(), Some(4));
    let stdout_corrupt = String::from_utf8_lossy(&out_corrupt.stdout);
    assert!(
        stdout_corrupt.trim().is_empty(),
        "Stdout must not receive logs or errors, got: {}",
        stdout_corrupt
    );
    let stderr_corrupt = String::from_utf8_lossy(&out_corrupt.stderr);
    // Stderr must contain the log::error! output from resolve_envelope_locale
    assert!(
        stderr_corrupt.contains("Failed to resolve machine locale from database"),
        "Expected stderr to log locale failure, got: {}",
        stderr_corrupt
    );
    // Stderr must also contain the error envelope JSON
    assert!(
        stderr_corrupt.contains("DOM_ENTITY_NOT_FOUND"),
        "Expected stderr to contain JSON error envelope, got: {}",
        stderr_corrupt
    );

    // Cleanup
    let _ = std::fs::remove_dir_all(&temp_dir);
}
