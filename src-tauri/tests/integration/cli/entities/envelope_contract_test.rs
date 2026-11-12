use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use chrono::Utc;
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::NewTimeLog;
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
        .build();
    persistence.projects.create(project).unwrap();

    let project2 = ProjectBuilder::new()
        .with_id("p_env_2")
        .with_name("Second Project")
        .with_color("blue")
        .build();
    persistence.projects.create(project2).unwrap();

    for (id, name) in [("t_env_a", "Alpha"), ("t_env_b", "Beta")] {
        let task = TaskBuilder::new()
            .with_id(id)
            .with_project_id("p_env")
            .with_name(name)
            .build();
        persistence.tasks.create(task).unwrap();
    }

    let log = NewTimeLog {
        id: "l_env".to_string(),
        task_id: "t_env_a".to_string(),
        start_time: "2026-06-15T09:00:00Z".to_string(),
        end_time: Some("2026-06-15T09:30:00Z".to_string()),
        note: Some("Initial note".to_string()),
    };
    persistence.time_logs.insert_full(&log).unwrap();
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
fn test_given_each_migrated_entity_command_when_run_in_machine_mode_then_stdout_is_a_camel_case_envelope(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_entity_envelope_contract");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    seed(&persistence);

    let commands = [
        MigratedCommand {
            args: &["--machine", "project", "ls"],
            schema: "oxy.project.list",
        },
        MigratedCommand {
            args: &["--machine", "project", "add", "Contract Created Project"],
            schema: "oxy.project.add",
        },
        MigratedCommand {
            args: &[
                "--machine",
                "project",
                "rename",
                "p_env",
                "Renamed Envelope Proj",
            ],
            schema: "oxy.project.rename",
        },
        MigratedCommand {
            args: &["--machine", "project", "archive", "p_env"],
            schema: "oxy.project.archive",
        },
        MigratedCommand {
            args: &["--machine", "task", "ls"],
            schema: "oxy.task.list",
        },
        MigratedCommand {
            args: &[
                "--machine",
                "task",
                "add",
                "Contract Created Task",
                "-p",
                "p_env_2",
            ],
            schema: "oxy.task.add",
        },
        MigratedCommand {
            args: &["--machine", "task", "done", "t_env_a"],
            schema: "oxy.task.done",
        },
        MigratedCommand {
            args: &[
                "--machine",
                "task",
                "rename",
                "t_env_a",
                "Contract Renamed Task",
            ],
            schema: "oxy.task.rename",
        },
        MigratedCommand {
            args: &["--machine", "task", "rate", "t_env_a", "90"],
            schema: "oxy.task.rate",
        },
        MigratedCommand {
            args: &["--machine", "task", "reparent", "t_env_b", "root"],
            schema: "oxy.task.reparent",
        },
        MigratedCommand {
            args: &["--machine", "task", "move", "t_env_a", "p_env_2"],
            schema: "oxy.task.move",
        },
        MigratedCommand {
            args: &["--machine", "task", "archive", "t_env_a"],
            schema: "oxy.task.archive",
        },
        MigratedCommand {
            args: &["--machine", "log", "ls"],
            schema: "oxy.log.list",
        },
        MigratedCommand {
            args: &["--machine", "log", "add", "t_env_b", "45m"],
            schema: "oxy.log.add",
        },
        MigratedCommand {
            args: &[
                "--machine",
                "log",
                "edit",
                "l_env",
                "--reason",
                "contract verification",
                "--note",
                "edited note",
            ],
            schema: "oxy.log.edit",
        },
        MigratedCommand {
            args: &["--machine", "log", "rm", "l_env"],
            schema: "oxy.log.remove",
        },
    ];

    for command in commands {
        // When
        let stdout = run(command.args, &persistence, &engine);

        // Then
        let envelope: Value = serde_json::from_str(&stdout)
            .unwrap_or_else(|e| panic!("{:?} printed invalid JSON ({e}): {stdout}", command.args));
        assert_eq!(envelope["schema"], command.schema, "{:?}", command.args);
        assert_eq!(envelope["schemaVersion"], 1, "{:?}", command.args);
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
