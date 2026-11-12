use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use serde_json::Value;

fn run(args: &[&str], persistence: &Persistence, engine: &Engine) -> String {
    let mut full = vec!["oxy"];
    full.extend_from_slice(args);
    let cli_args = CliArgs::try_parse_from(full).unwrap();
    handle_cli(cli_args, persistence, engine)
        .expect("command should succeed")
        .to_string()
}

fn is_camel_case(key: &str) -> bool {
    let mut chars = key.chars();
    chars.next().is_some_and(|c| c.is_ascii_lowercase()) && chars.all(|c| c.is_ascii_alphanumeric())
}

fn non_camel_case_keys(value: &Value, path: &str, offenders: &mut Vec<String>) {
    match value {
        Value::Object(map) => {
            for (key, child) in map {
                let child_path = format!("{path}.{key}");
                if !is_camel_case(key) {
                    offenders.push(child_path.clone());
                }
                non_camel_case_keys(child, &child_path, offenders);
            }
        }
        Value::Array(items) => {
            for (index, child) in items.iter().enumerate() {
                non_camel_case_keys(child, &format!("{path}[{index}]"), offenders);
            }
        }
        _ => {}
    }
}

/// Ordered command matrix; the sequence matters because later commands read what earlier ones wrote.
fn migrated_commands<'a>(
    csv_dir: &'a str,
    backup_path: &'a str,
) -> Vec<(Vec<&'a str>, &'static str)> {
    vec![
        (
            vec!["--machine", "config", "set", "ui_theme", "dark"],
            "oxy.config.set",
        ),
        (
            vec!["--machine", "config", "get", "ui_theme"],
            "oxy.config.get",
        ),
        (
            vec!["--machine", "config", "get", "cli_machine_locale"],
            "oxy.config.get",
        ),
        (vec!["--machine", "config", "ls"], "oxy.config.list"),
        (
            vec!["--machine", "sink", "set-csv", "--dir", csv_dir],
            "oxy.sink.set",
        ),
        (
            vec![
                "--machine",
                "sink",
                "set-webhook",
                "--url",
                "https://example.com/hook",
                "--token",
                "contract-token",
            ],
            "oxy.sink.set",
        ),
        (vec!["--machine", "sink", "ls"], "oxy.sink.list"),
        (vec!["--machine", "sink", "test"], "oxy.sink.test"),
        (
            vec!["--machine", "mask", "set", "review", "log add PR 30m"],
            "oxy.mask.set",
        ),
        (vec!["--machine", "mask", "ls"], "oxy.mask.list"),
        (vec!["--machine", "mask", "rm", "review"], "oxy.mask.remove"),
        (vec!["--machine", "doctor"], "oxy.doctor"),
        (
            vec!["--machine", "db", "backup", backup_path],
            "oxy.db.backup",
        ),
        (
            vec!["--machine", "db", "restore", backup_path],
            "oxy.db.restore",
        ),
    ]
}

#[test]
fn test_given_each_migrated_subsystem_command_when_run_in_machine_mode_then_stdout_is_a_camel_case_envelope(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_subsystem_envelope_contract");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    let csv_dir = std::env::temp_dir().join(format!("oxy_contract_csv_{}", uuid::Uuid::new_v4()));
    let backup_path =
        std::env::temp_dir().join(format!("oxy_contract_{}.db", uuid::Uuid::new_v4()));
    let csv_dir_str = csv_dir.to_str().unwrap();
    let backup_str = backup_path.to_str().unwrap();

    for (args, schema) in migrated_commands(csv_dir_str, backup_str) {
        // When
        let stdout = run(&args, &persistence, &engine);

        // Then
        let envelope: Value = serde_json::from_str(&stdout)
            .unwrap_or_else(|e| panic!("{args:?} printed invalid JSON ({e}): {stdout}"));
        assert_eq!(envelope["schema"], schema, "{args:?}");
        assert_eq!(envelope["schemaVersion"], 1, "{args:?}");
        assert!(envelope["data"].is_object(), "{args:?}");
        assert!(envelope["data"].get("status").is_none(), "{args:?}");
        assert!(envelope["meta"]["generatedAt"].is_string(), "{args:?}");
        assert!(
            envelope["meta"]["generator"]["version"].is_string(),
            "{args:?}"
        );
        let mut offenders = Vec::new();
        non_camel_case_keys(&envelope, "$", &mut offenders);
        assert!(
            offenders.is_empty(),
            "{args:?} has non-camelCase keys: {offenders:?}"
        );
    }

    let _ = std::fs::remove_dir_all(&csv_dir);
    let _ = std::fs::remove_file(&backup_path);
}

#[test]
fn test_given_unset_machine_locale_when_config_ls_in_machine_mode_then_items_omit_the_default() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_subsystem_config_ls_persisted_only");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    // When
    let listed: Value =
        serde_json::from_str(&run(&["--machine", "config", "ls"], &persistence, &engine)).unwrap();
    let effective: Value = serde_json::from_str(&run(
        &["--machine", "config", "get", "cli_machine_locale"],
        &persistence,
        &engine,
    ))
    .unwrap();

    // Then
    let items = listed["data"]["items"].as_array().expect("items array");
    assert!(!items.iter().any(|item| item["key"] == "cli_machine_locale"));
    assert_eq!(effective["data"]["value"], "en");
}

#[test]
fn test_given_no_sinks_when_sink_test_in_machine_mode_then_items_is_an_empty_list() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_subsystem_sink_test_empty");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    // When
    let stdout = run(&["--machine", "sink", "test"], &persistence, &engine);

    // Then
    let envelope: Value = serde_json::from_str(&stdout).unwrap();
    assert_eq!(envelope["schema"], "oxy.sink.test");
    assert_eq!(envelope["data"], serde_json::json!({ "items": [] }));
}
