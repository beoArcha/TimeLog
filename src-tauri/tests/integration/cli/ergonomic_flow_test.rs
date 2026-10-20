use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::{handle_cli, CliArgs, CliOutput};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use rusqlite::Connection;

fn setup(db_name: &str) -> (Persistence, Connection, crate::shared::test_db::TempCsvDir) {
    let (conn, config, temp_dir) = setup_persistence_test(db_name);
    let persistence = Persistence::new(&config).expect("failed to create persistence layer");

    let project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Core API")
        .with_color("blue")
        .build();
    let task1 = TaskBuilder::new()
        .with_id("t-auth-01")
        .with_project_id("p1")
        .with_name("OAuth2 Implementation")
        .build();
    let task2 = TaskBuilder::new()
        .with_id("t-docs-02")
        .with_project_id("p1")
        .with_name("API Documentation")
        .build();

    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task1).unwrap();
    persistence.tasks.create(task2).unwrap();

    (persistence, conn, temp_dir)
}

#[test]
fn test_given_task_name_when_start_invoked_with_substring_then_resolves_and_starts_timer() {
    // Given
    let (persistence, _conn, _temp) = setup("test_flow_start_substring");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "start", "oauth"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let output = result.unwrap();
    assert!(
        matches!(output, CliOutput::Started(ref id) if id == "t-auth-01"),
        "Started output should match target task resolved by substring"
    );

    let active = engine.get_active_logs().unwrap();
    assert_eq!(active.len(), 1);
    assert_eq!(active[0], "t-auth-01");
}

#[test]
fn test_given_active_timer_when_switch_invoked_then_atomically_stops_previous_and_starts_new_target(
) {
    // Given
    let (persistence, _conn, _temp) = setup("test_flow_switch_atomic");
    let engine = Engine::new(&persistence);
    engine.start_timer("t-auth-01").unwrap();
    assert_eq!(engine.get_active_logs().unwrap(), vec!["t-auth-01"]);

    let args = CliArgs::try_parse_from(["oxy", "sw", "docs"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(
        result.is_ok(),
        "switch should succeed, but got error: {:?}",
        result.err()
    );
    let active = engine.get_active_logs().unwrap();
    assert_eq!(active.len(), 1);
    assert_eq!(
        active[0], "t-docs-02",
        "Switched timer should be running t-docs-02"
    );
}

#[test]
fn test_given_projects_and_tasks_when_task_list_invoked_then_displays_hierarchy_with_subtasks() {
    // Given
    let (persistence, _conn, _temp) = setup("test_flow_task_list_hierarchy");
    let engine = Engine::new(&persistence);
    let subtask = TaskBuilder::new()
        .with_id("t-sub-01")
        .with_project_id("p1")
        .with_parent("t-auth-01")
        .with_name("Token Refresh Subtask")
        .build();
    persistence.tasks.create(subtask).unwrap();

    let args = CliArgs::try_parse_from(["oxy", "t", "ls", "--all"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    if let CliOutput::Success(text) = result.unwrap() {
        assert!(text.contains("OAuth2 Implementation"));
        assert!(text.contains("↳"));
        assert!(text.contains("Token Refresh Subtask"));
    } else {
        panic!("Expected Success output with task hierarchy");
    }
}

#[test]
fn test_given_incomplete_task_when_done_invoked_then_marks_task_completed() {
    // Given
    let (persistence, _conn, _temp) = setup("test_flow_task_done");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "t", "done", "oauth"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let task = persistence.tasks.get("t-auth-01").unwrap().unwrap();
    assert!(
        task.completed,
        "Task should be marked as completed in persistence"
    );
}

#[test]
fn test_given_target_task_when_log_add_invoked_then_creates_retroactive_entry_with_duration() {
    // Given
    let (persistence, _conn, _temp) = setup("test_flow_log_add");
    let engine = Engine::new(&persistence);
    let args =
        CliArgs::try_parse_from(["oxy", "l", "add", "docs", "45m", "Wrote API specifications"])
            .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(
        result.is_ok(),
        "log add should succeed, but got error: {:?}",
        result.err()
    );
    let logs = persistence.time_logs.get_all().unwrap();
    assert_eq!(logs.len(), 1);
    assert_eq!(logs[0].task_id, "t-docs-02");
    assert_eq!(logs[0].note.as_deref(), Some("Wrote API specifications"));
    assert!(logs[0].end_time.is_some());
}

#[test]
fn test_given_empty_args_when_cli_handled_then_displays_glance_dashboard() {
    // Given
    let (persistence, _conn, _temp) = setup("test_flow_glance");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    if let CliOutput::Success(text) = result.unwrap() {
        assert!(text.contains("Quick Status"));
        assert!(text.contains("IDLE"));
    } else {
        panic!("Expected Success output with glance status");
    }
}
