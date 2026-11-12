use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use serde_json::Value;

struct MigratedCommand {
    args: &'static [&'static str],
    schema: &'static str,
}

fn seed(persistence: &Persistence) {
    let project = ProjectBuilder::new()
        .with_id("p_env")
        .with_name("Envelope Project")
        .with_color("teal")
        .with_allow_concurrency(false)
        .build();
    persistence.projects.create(project).unwrap();
    for (id, name) in [("t_env_a", "Alpha"), ("t_env_b", "Beta")] {
        let task = TaskBuilder::new()
            .with_id(id)
            .with_project_id("p_env")
            .with_name(name)
            .build();
        persistence.tasks.create(task).unwrap();
    }
}

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

#[test]
fn test_given_each_migrated_flow_command_when_run_in_machine_mode_then_stdout_is_a_camel_case_envelope(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_envelope_contract");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    seed(&persistence);
    let commands = [
        MigratedCommand {
            args: &["--machine", "status"],
            schema: "oxy.status",
        },
        MigratedCommand {
            args: &["--machine", "start", "t_env_a"],
            schema: "oxy.start",
        },
        MigratedCommand {
            args: &["--machine", "start", "t_env_a"],
            schema: "oxy.start",
        },
        MigratedCommand {
            args: &["--machine", "start"],
            schema: "oxy.status",
        },
        MigratedCommand {
            args: &["--machine", "status"],
            schema: "oxy.status",
        },
        MigratedCommand {
            args: &["--machine", "switch", "t_env_b"],
            schema: "oxy.switch",
        },
        MigratedCommand {
            args: &["--machine", "stop"],
            schema: "oxy.stop",
        },
        MigratedCommand {
            args: &["--machine", "stop", "--if-running"],
            schema: "oxy.stop",
        },
    ];

    for command in commands {
        // When
        let stdout = run(command.args, &persistence, &engine);

        // Then
        let envelope: Value = serde_json::from_str(&stdout)
            .unwrap_or_else(|e| panic!("{:?} printed invalid JSON ({e}): {stdout}", command.args));
        assert_eq!(envelope["schema"], command.schema, "{:?}", command.args);
        assert!(envelope["schemaVersion"].is_u64(), "{:?}", command.args);
        assert!(envelope["data"].is_object(), "{:?}", command.args);
        assert!(envelope["meta"]["generatedAt"].is_string());
        assert!(envelope["meta"]["generator"]["version"].is_string());
        let mut offenders = Vec::new();
        non_camel_case_keys(&envelope, "$", &mut offenders);
        assert!(
            offenders.is_empty(),
            "{:?} has non-camelCase keys: {offenders:?}",
            command.args
        );
    }
}

#[test]
fn test_given_idle_timer_when_status_in_machine_mode_then_data_reports_not_running() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_envelope_status_idle");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    // When
    let stdout = run(&["--machine", "status"], &persistence, &engine);

    // Then
    let envelope: Value = serde_json::from_str(&stdout).unwrap();
    assert_eq!(
        envelope["data"],
        serde_json::json!({ "activeTaskIds": [], "count": 0, "running": false })
    );
}

#[test]
fn test_given_idle_timer_when_start_quiet_then_prints_only_the_new_time_log_id() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_quiet_start");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    seed(&persistence);

    // When
    let printed = run(&["start", "t_env_a", "-q"], &persistence, &engine);

    // Then
    let log = persistence.time_logs.get_by_id(&printed).unwrap();
    assert_eq!(log.task_id, "t_env_a");
}

#[test]
fn test_given_running_task_when_start_quiet_again_then_prints_nothing_because_no_log_is_created() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_quiet_start_noop");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    seed(&persistence);
    run(&["start", "t_env_a"], &persistence, &engine);

    // When
    let printed = run(&["start", "t_env_a", "-q"], &persistence, &engine);

    // Then
    assert_eq!(printed, "");
}

#[test]
fn test_given_running_task_when_switch_quiet_then_prints_only_the_new_time_log_id() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_quiet_switch");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    seed(&persistence);
    run(&["start", "t_env_a"], &persistence, &engine);

    // When
    let printed = run(&["switch", "t_env_b", "-q"], &persistence, &engine);

    // Then
    let log = persistence.time_logs.get_by_id(&printed).unwrap();
    assert_eq!(log.task_id, "t_env_b");
    assert!(log.end_time.is_none());
}
