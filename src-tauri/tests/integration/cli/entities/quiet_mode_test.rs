use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs, CliError, CliOutput};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;

fn execute(
    persistence: &Persistence,
    engine: &Engine,
    args: &[&str],
) -> Result<CliOutput, CliError> {
    let parsed = CliArgs::try_parse_from(std::iter::once("oxy").chain(args.iter().copied()))
        .expect("test arguments must parse");
    handle_cli(parsed, persistence, engine)
}

fn add_project(persistence: &Persistence, engine: &Engine, name: &str) {
    execute(persistence, engine, &["project", "add", name]).expect("project setup must succeed");
}

fn add_task(persistence: &Persistence, engine: &Engine, name: &str) {
    execute(persistence, engine, &["task", "add", name]).expect("task setup must succeed");
}

#[test]
fn test_given_existing_project_when_task_add_quiet_then_returns_only_persisted_task_id() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_quiet_task_add");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);
    add_project(&persistence, &engine, "Quiet Project");

    // When
    let result = execute(&persistence, &engine, &["task", "add", "Quiet Task", "-q"]);

    // Then
    let rendered = result.expect("quiet task add must succeed").to_string();
    let stored = persistence
        .tasks
        .get_all()
        .expect("tasks must load")
        .into_iter()
        .find(|t| t.name == "Quiet Task")
        .expect("created task must be persisted");
    assert_eq!(rendered, stored.id);
    assert!(!rendered.chars().any(char::is_whitespace));
}

#[test]
fn test_given_empty_database_when_project_add_quiet_then_returns_only_persisted_project_id() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_quiet_project_add");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    // When
    let result = execute(
        &persistence,
        &engine,
        &["project", "add", "Quiet Project", "-q"],
    );

    // Then
    let rendered = result.expect("quiet project add must succeed").to_string();
    let stored = persistence.projects.get_all().expect("projects must load");
    assert_eq!(stored.len(), 1);
    assert_eq!(rendered, stored[0].id);
}

#[test]
fn test_given_existing_task_when_done_quiet_then_returns_only_task_id() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_quiet_task_done");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);
    add_project(&persistence, &engine, "Quiet Project");
    add_task(&persistence, &engine, "Finish Me");
    let task_id = persistence.tasks.get_all().expect("tasks must load")[0]
        .id
        .clone();

    // When
    let result = execute(
        &persistence,
        &engine,
        &["task", "done", task_id.as_str(), "-q"],
    );

    // Then
    assert_eq!(
        result.expect("quiet done must succeed").to_string(),
        task_id
    );
}

#[test]
fn test_given_existing_projects_when_project_ls_quiet_then_omits_header_and_status_prefix() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_quiet_project_ls");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);
    add_project(&persistence, &engine, "Alpha Client");
    add_project(&persistence, &engine, "Beta Client");

    // When
    let result = execute(&persistence, &engine, &["project", "ls", "-q"]);

    // Then
    let rendered = result.expect("quiet project ls must succeed").to_string();
    assert!(!rendered.contains("Projects:"));
    assert!(!rendered.contains('✅'));
    assert_eq!(rendered.lines().count(), 2);
    assert!(rendered.contains("Alpha Client"));
    assert!(rendered.contains("Beta Client"));
}

#[test]
fn test_given_no_projects_when_project_ls_quiet_then_renders_empty_output() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_quiet_project_ls_empty");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    // When
    let result = execute(&persistence, &engine, &["project", "ls", "-q"]);

    // Then
    assert!(result
        .expect("empty quiet listing must succeed")
        .to_string()
        .is_empty());
}

#[test]
fn test_given_existing_tasks_when_task_ls_quiet_then_omits_header_and_status_prefix() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_quiet_task_ls");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);
    add_project(&persistence, &engine, "Quiet Project");
    add_task(&persistence, &engine, "First Quiet Task");
    add_task(&persistence, &engine, "Second Quiet Task");

    // When
    let result = execute(&persistence, &engine, &["task", "ls", "-q"]);

    // Then
    let rendered = result.expect("quiet task ls must succeed").to_string();
    assert!(!rendered.contains("Tasks:"));
    assert!(!rendered.contains('✅'));
    assert_eq!(rendered.lines().count(), 2);
    assert!(rendered.contains("First Quiet Task"));
    assert!(rendered.contains("Second Quiet Task"));
}

#[test]
fn test_given_logged_time_when_log_add_quiet_then_returns_only_persisted_log_id() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_quiet_log_add");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);
    add_project(&persistence, &engine, "Quiet Project");
    add_task(&persistence, &engine, "Logged Task");

    // When
    let result = execute(
        &persistence,
        &engine,
        &["log", "add", "Logged Task", "15m", "-q"],
    );

    // Then
    let rendered = result.expect("quiet log add must succeed").to_string();
    let logs = persistence.time_logs.get_all().expect("logs must load");
    assert_eq!(logs.len(), 1);
    assert_eq!(rendered, logs[0].id);
}

#[test]
fn test_given_logged_time_when_log_ls_quiet_then_omits_header_and_status_prefix() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_quiet_log_ls");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);
    add_project(&persistence, &engine, "Quiet Project");
    add_task(&persistence, &engine, "Logged Task");
    execute(&persistence, &engine, &["log", "add", "Logged Task", "15m"])
        .expect("log setup must succeed");

    // When
    let result = execute(&persistence, &engine, &["log", "ls", "-q"]);

    // Then
    let rendered = result.expect("quiet log ls must succeed").to_string();
    assert!(!rendered.contains("Time Logs:"));
    assert!(!rendered.contains('✅'));
    assert_eq!(rendered.lines().count(), 1);
    assert!(rendered.contains("Logged Task"));
}

#[test]
fn test_given_no_projects_when_task_add_quiet_then_fails_with_same_exit_code_as_verbose() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_quiet_error_exit_code");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    // When
    let quiet = execute(&persistence, &engine, &["task", "add", "Orphan", "-q"]);
    let verbose = execute(&persistence, &engine, &["task", "add", "Orphan"]);

    // Then
    let quiet_err = quiet.expect_err("quiet mode must not hide the failure");
    let verbose_err = verbose.expect_err("verbose mode must fail for the same input");
    assert_eq!(quiet_err.exit_code(), verbose_err.exit_code());
}
