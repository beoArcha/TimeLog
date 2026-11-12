use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs, CliOutput};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;

fn setup_with_task(
    db_name: &str,
) -> (
    Persistence,
    crate::shared::test_db::TempCsvDir,
    rusqlite::Connection,
) {
    let (conn, config, temp_dir) = setup_persistence_test(db_name);
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let project = ProjectBuilder::new()
        .with_id("p_ifrun")
        .with_name("If Running Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t_ifrun")
        .with_project_id("p_ifrun")
        .with_name("If Running Task")
        .build();
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();
    (persistence, temp_dir, conn)
}

#[test]
fn test_given_idle_timer_when_stop_if_running_invoked_then_succeeds_with_nothing_to_stop_message() {
    // Given
    let (persistence, _temp, _conn) = setup_with_task("test_stop_if_running_human_idle");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "stop", "--if-running"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    let output = result.expect("stop --if-running must succeed when no timer runs");
    assert!(output.to_string().contains("No active timer"));
    assert!(engine.get_active_logs().unwrap().is_empty());
}

#[test]
fn test_given_idle_timer_when_stop_if_running_invoked_in_machine_mode_then_returns_noop_json() {
    // Given
    let (persistence, _temp, _conn) = setup_with_task("test_stop_if_running_machine_idle");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "--machine", "stop", "--if-running"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    let output = result.expect("machine stop --if-running must succeed when idle");
    let parsed: serde_json::Value =
        serde_json::from_str(&output.to_string()).expect("body must be valid JSON");
    assert_eq!(parsed["schema"], "oxy.stop");
    assert_eq!(
        parsed["data"],
        serde_json::json!({ "action": "noop", "stoppedCount": 0 })
    );
}

#[test]
fn test_given_running_timer_when_stop_if_running_invoked_then_stops_timer_like_plain_stop() {
    // Given
    let (persistence, _temp, _conn) = setup_with_task("test_stop_if_running_active");
    let engine = Engine::new(&persistence);
    engine.start_timer("t_ifrun").unwrap();
    let args = CliArgs::try_parse_from(["oxy", "stop", "--if-running"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert_eq!(result.unwrap(), CliOutput::Stopped);
    assert!(engine.get_active_logs().unwrap().is_empty());
}

#[test]
fn test_given_idle_timer_when_stop_invoked_without_flag_then_still_fails_with_timer_inactive() {
    // Given
    let (persistence, _temp, _conn) = setup_with_task("test_stop_without_if_running_idle");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "stop"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    let err = result.expect_err("plain stop must fail when no timer runs");
    assert_eq!(err.exit_code(), 5);
    assert_eq!(err.to_envelope(None).code, "ENG_TIMER_INACTIVE");
}
