use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use chrono::{Duration, Utc};
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs, CliOutput};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::NewTimeLog;
use serde_json::Value;

fn seed_task(persistence: &Persistence) {
    let project = ProjectBuilder::new()
        .with_id("p-td")
        .with_name("Core API")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-td")
        .with_project_id("p-td")
        .with_name("Auth Handler")
        .build();
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();
}

/// Closed session from 23:00 UTC yesterday to 01:00 UTC today: two hours, one of them today.
fn seed_midnight_crossing_log(persistence: &Persistence) {
    let today = Utc::now().date_naive();
    let yesterday = today - Duration::days(1);
    let log = NewTimeLog {
        id: "l-td".to_string(),
        task_id: "t-td".to_string(),
        start_time: format!("{yesterday}T23:00:00Z"),
        end_time: Some(format!("{today}T01:00:00Z")),
        note: None,
    };
    persistence.time_logs.insert_full(&log).unwrap();
}

fn run(args: &[&str], persistence: &Persistence, engine: &Engine) -> CliOutput {
    let mut full = vec!["oxy"];
    full.extend_from_slice(args);
    let cli_args = CliArgs::try_parse_from(full).unwrap();
    handle_cli(cli_args, persistence, engine).expect("command should succeed")
}

fn envelope_of(output: &CliOutput) -> Value {
    serde_json::from_str(&output.to_string()).unwrap()
}

#[test]
fn test_given_session_crossing_midnight_when_today_in_machine_mode_then_envelope_holds_the_clamped_report(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_today_envelope_clamped");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    seed_task(&persistence);
    seed_midnight_crossing_log(&persistence);

    // When
    let envelope = envelope_of(&run(
        &["--machine", "today", "--tz", "UTC"],
        &persistence,
        &engine,
    ));

    // Then
    assert_eq!(envelope["schema"], "oxy.today");
    assert_eq!(envelope["schemaVersion"], 1);
    let report = &envelope["data"];
    assert_eq!(report["schema"], "oxy.report");
    assert_eq!(report["range"]["preset"], "today");
    assert_eq!(report["totals"]["seconds"], 3600);
    let entry = &report["entries"][0];
    assert_eq!(entry["seconds"], 3600);
    assert_eq!(entry["originalSeconds"], 7200);
    assert_eq!(entry["clamped"], true);
}

#[test]
fn test_given_session_crossing_midnight_when_today_in_human_mode_then_figures_cover_only_today() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_today_human_clamped");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    seed_task(&persistence);
    seed_midnight_crossing_log(&persistence);

    // When
    let text = run(&["today", "--tz", "UTC"], &persistence, &engine).to_string();

    // Then
    assert!(text.contains("[Core API] Auth Handler ➔ 60m 00s"), "{text}");
    assert!(
        text.contains("Total Time Today: 1h 00m (1 entries)"),
        "{text}"
    );
}

#[test]
fn test_given_session_crossing_midnight_when_glance_in_machine_mode_then_totals_match_today() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_glance_matches_today");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    seed_task(&persistence);
    seed_midnight_crossing_log(&persistence);

    // When
    let today = envelope_of(&run(
        &["--machine", "today", "--tz", "UTC"],
        &persistence,
        &engine,
    ));
    let dashboard = envelope_of(&run(&["--machine", "--tz", "UTC"], &persistence, &engine));

    // Then
    assert_eq!(dashboard["schema"], "oxy.dashboard");
    assert_eq!(dashboard["schemaVersion"], 1);
    let data = &dashboard["data"];
    assert_eq!(
        data["todayTotalSeconds"], today["data"]["totals"]["seconds"],
        "{dashboard}"
    );
    assert_eq!(data["sessionCount"], today["data"]["totals"]["entryCount"]);
    assert_eq!(data["recentTasks"][0]["taskName"], "Auth Handler");
    assert_eq!(data["recentTasks"][0]["durationSeconds"], 3600);
}

#[test]
fn test_given_running_timer_when_glance_in_machine_mode_then_payload_has_no_formatted_strings() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("cli_glance_machine_shape");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    seed_task(&persistence);
    engine.start_timer("t-td").unwrap();

    // When
    let envelope = envelope_of(&run(&["--machine"], &persistence, &engine));

    // Then
    let data = envelope["data"].as_object().unwrap();
    assert_eq!(data["running"], true);
    assert_eq!(data["activeSession"]["taskName"], "Auth Handler");
    assert_eq!(data["activeSession"]["projectName"], "Core API");
    assert!(data["activeSession"]["elapsedSeconds"].is_u64());
    assert!(
        data.keys().all(|key| !key.contains("ormatted")),
        "formatted strings leaked into machine output: {data:?}"
    );
}
