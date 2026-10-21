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
        .with_id("p-flow-1")
        .with_name("Core API")
        .with_color("blue")
        .build();
    let task1 = TaskBuilder::new()
        .with_id("t-auth-01")
        .with_project_id("p-flow-1")
        .with_name("OAuth2 Implementation")
        .build();
    let task2 = TaskBuilder::new()
        .with_id("t-docs-02")
        .with_project_id("p-flow-1")
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
    let (persistence, _conn, _temp) = setup("test_shortcuts_start_substring");
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
    let (persistence, _conn, _temp) = setup("test_shortcuts_switch_atomic");
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
fn test_given_active_timer_when_stop_invoked_then_stops_active_sessions_and_returns_stopped() {
    // Given
    let (persistence, _conn, _temp) = setup("test_shortcuts_stop");
    let engine = Engine::new(&persistence);
    engine.start_timer("t-auth-01").unwrap();

    let args = CliArgs::try_parse_from(["oxy", "stop"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    assert!(engine.get_active_logs().unwrap().is_empty());
}

#[test]
fn test_given_running_timer_when_status_invoked_then_returns_active_tasks() {
    // Given
    let (persistence, _conn, _temp) = setup("test_shortcuts_status");
    let engine = Engine::new(&persistence);
    engine.start_timer("t-auth-01").unwrap();

    let args = CliArgs::try_parse_from(["oxy", "st"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    match result.unwrap() {
        CliOutput::Status(active) => {
            assert_eq!(active.len(), 1);
            assert_eq!(active[0], "t-auth-01");
        }
        other => panic!("Expected Status output, got {:?}", other),
    }
}

#[test]
fn test_given_empty_args_when_cli_handled_then_displays_glance_dashboard() {
    // Given
    let (persistence, _conn, _temp) = setup("test_shortcuts_glance_dashboard");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let output = result.unwrap();
    let display_str = output.to_string();
    assert!(
        display_str.contains("Quick Status Dashboard") || display_str.contains("oXyFlow"),
        "Glance output should display status header: {}",
        display_str
    );
}
