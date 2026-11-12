use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;

fn run(args: &[&str], persistence: &Persistence, engine: &Engine) -> String {
    let mut full = vec!["oxy"];
    full.extend_from_slice(args);
    let cli_args = CliArgs::try_parse_from(full).unwrap();
    handle_cli(cli_args, persistence, engine)
        .expect("command should succeed")
        .to_string()
}

fn seed(persistence: &Persistence) {
    for (proj_id, task_id, task_name) in [
        ("p_idem_a", "t_idem_a", "Code"),
        ("p_idem_b", "t_idem_b", "Review"),
    ] {
        let project = ProjectBuilder::new()
            .with_id(proj_id)
            .with_name(proj_id)
            .with_color("teal")
            .with_allow_concurrency(false)
            .build();
        persistence.projects.create(project).unwrap();
        let task = TaskBuilder::new()
            .with_id(task_id)
            .with_project_id(proj_id)
            .with_name(task_name)
            .build();
        persistence.tasks.create(task).unwrap();
    }
}

#[test]
fn test_given_running_task_when_started_twice_then_single_log_and_already_running_json() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_start_idempotent_json");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    seed(&persistence);

    // When
    let first = run(&["--machine", "start", "t_idem_a"], &persistence, &engine);
    let second = run(&["--machine", "start", "t_idem_a"], &persistence, &engine);
    run(&["stop"], &persistence, &engine);

    // Then
    let first_json: serde_json::Value = serde_json::from_str(&first).unwrap();
    let second_json: serde_json::Value = serde_json::from_str(&second).unwrap();
    assert_eq!(first_json["action"], "started");
    assert_eq!(first_json["task_id"], "t_idem_a");
    assert_eq!(first_json["stopped_task_ids"], serde_json::json!([]));
    assert_eq!(second_json["status"], "ok");
    assert_eq!(second_json["action"], "already_running");
    assert_eq!(second_json["task_id"], "t_idem_a");
    let logs = persistence.time_logs.get_all().unwrap();
    assert_eq!(logs.iter().filter(|l| l.task_id == "t_idem_a").count(), 1);
}

#[test]
fn test_given_running_task_when_started_again_in_human_mode_then_reports_already_tracking() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_start_idempotent_human");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    seed(&persistence);
    run(&["start", "t_idem_a"], &persistence, &engine);

    // When
    let output = run(&["start", "t_idem_a"], &persistence, &engine);

    // Then
    assert_eq!(output, "Already tracking 'Code' [t_idem_a].");
}

#[test]
fn test_given_running_task_when_other_task_started_then_stopped_tasks_are_reported() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_start_reports_stopped");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    seed(&persistence);
    run(&["start", "t_idem_a"], &persistence, &engine);

    // When
    let human = run(&["start", "t_idem_b"], &persistence, &engine);
    run(&["start", "t_idem_a"], &persistence, &engine);
    let machine = run(&["--machine", "start", "t_idem_b"], &persistence, &engine);

    // Then
    assert!(human.contains("Started tracking task: t_idem_b"));
    assert!(human.ends_with("\nStopped: 'Code' [t_idem_a]"));
    let json: serde_json::Value = serde_json::from_str(&machine).unwrap();
    assert_eq!(json["action"], "started");
    assert_eq!(json["stopped_task_ids"], serde_json::json!(["t_idem_a"]));
}
