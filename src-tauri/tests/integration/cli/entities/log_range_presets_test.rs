use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::{setup_persistence_test, TempCsvDir};
use chrono::{DateTime, Datelike, Duration, Utc, Weekday};
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::{NewTimeLog, RangePreset, RangeRequest, ResolvedRange};
use rusqlite::Connection;

const SETTLE_ATTEMPTS: usize = 5;

fn setup(db_name: &str) -> (Persistence, Connection, TempCsvDir) {
    let (conn, config, temp) = setup_persistence_test(db_name);
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let project = ProjectBuilder::new()
        .with_id("p-preset")
        .with_name("Preset Project")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-preset")
        .with_project_id("p-preset")
        .with_name("Preset Task")
        .build();
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();
    (persistence, conn, temp)
}

fn insert_log(persistence: &Persistence, id: &str, start: DateTime<Utc>) {
    let end = start + Duration::hours(1);
    persistence
        .time_logs
        .insert_full(&NewTimeLog {
            id: id.to_string(),
            task_id: "t-preset".to_string(),
            start_time: start.to_rfc3339(),
            end_time: Some(end.to_rfc3339()),
            note: Some(id.to_string()),
        })
        .unwrap();
}

fn bound(raw: &Option<String>) -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(raw.as_deref().expect("preset range is bounded"))
        .unwrap()
        .with_timezone(&Utc)
}

fn resolve(engine: &Engine, preset: RangePreset, tz: &str) -> ResolvedRange {
    engine
        .resolve_range(&RangeRequest {
            preset: Some(preset),
            from: None,
            to: None,
            timezone: Some(tz.to_string()),
        })
        .unwrap()
}

/// Presets read the wall clock inside the CLI, so a scenario is only trusted when the range resolved before and
/// after it is identical; a run that straddles a period boundary is discarded and replayed on a fresh database.
fn settled<T>(
    name: &str,
    preset: RangePreset,
    tz: &str,
    scenario: impl Fn(&Persistence, &ResolvedRange) -> T,
) -> T {
    for attempt in 0..SETTLE_ATTEMPTS {
        let (persistence, _conn, _temp) = setup(&format!("{name}_{attempt}"));
        let engine = Engine::new(&persistence);
        let before = resolve(&engine, preset, tz);
        let outcome = scenario(&persistence, &before);
        if resolve(&engine, preset, tz) == before {
            return outcome;
        }
    }
    panic!("period boundary crossed on every attempt for {name}");
}

fn listed_ids(persistence: &Persistence, args: &[&str]) -> Vec<String> {
    let engine = Engine::new(persistence);
    let parsed = CliArgs::try_parse_from(args).unwrap();
    let rendered = format!("{}", handle_cli(parsed, persistence, &engine).unwrap());
    let env: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    let rows = env["data"]["items"].as_array().expect("items array");
    rows.iter()
        .map(|row| row["note"].as_str().unwrap().to_string())
        .collect()
}

fn seed_around(persistence: &Persistence, range: &ResolvedRange) {
    let from = bound(&range.from);
    let to = bound(&range.to);
    insert_log(persistence, "inside", from + Duration::hours(1));
    insert_log(persistence, "just-before-from", from - Duration::seconds(1));
    insert_log(persistence, "exactly-at-to", to);
}

#[test]
fn test_given_logs_around_yesterday_range_when_listing_with_yesterday_preset_then_returns_only_inside_log(
) {
    // Given
    let ids = settled(
        "log_ls_yesterday",
        RangePreset::Yesterday,
        "UTC",
        |persistence, range| {
            seed_around(persistence, range);

            // When
            listed_ids(
                persistence,
                &["oxy", "--json", "log", "ls", "--yesterday", "--tz", "UTC"],
            )
        },
    );

    // Then
    assert_eq!(ids, vec!["inside"]);
}

#[test]
fn test_given_logs_around_week_range_when_listing_with_week_preset_then_week_starts_on_monday() {
    // Given
    let (ids, week_start) = settled(
        "log_ls_week",
        RangePreset::Week,
        "UTC",
        |persistence, range| {
            seed_around(persistence, range);

            // When
            let ids = listed_ids(
                persistence,
                &["oxy", "--json", "log", "ls", "--week", "--tz", "UTC"],
            );
            (ids, bound(&range.from))
        },
    );

    // Then
    assert_eq!(ids, vec!["inside"]);
    assert_eq!(week_start.weekday(), Weekday::Mon);
}

#[test]
fn test_given_logs_around_last_month_range_when_listing_with_last_month_preset_then_returns_only_inside_log(
) {
    // Given
    let ids = settled(
        "log_ls_last_month",
        RangePreset::LastMonth,
        "UTC",
        |persistence, range| {
            seed_around(persistence, range);

            // When
            listed_ids(
                persistence,
                &["oxy", "--json", "log", "ls", "--last-month", "--tz", "UTC"],
            )
        },
    );

    // Then
    assert_eq!(ids, vec!["inside"]);
}

#[test]
fn test_given_log_exactly_at_to_bound_when_listing_with_instant_range_then_excludes_it() {
    // Given
    let (persistence, _conn, _temp) = setup("log_ls_exclusive_to");
    let boundary = DateTime::parse_from_rfc3339("2026-10-15T00:00:00Z")
        .unwrap()
        .with_timezone(&Utc);
    insert_log(&persistence, "at-to", boundary);
    insert_log(&persistence, "inside", boundary - Duration::hours(2));

    // When
    let ids = listed_ids(
        &persistence,
        &[
            "oxy",
            "--json",
            "log",
            "ls",
            "--from",
            "2026-10-14T00:00:00Z",
            "--to",
            "2026-10-15T00:00:00Z",
        ],
    );

    // Then
    assert_eq!(ids, vec!["inside"]);
}

#[test]
fn test_given_invalid_timezone_when_listing_logs_then_fails_with_syntax_exit_code() {
    // Given
    let (persistence, _conn, _temp) = setup("log_ls_invalid_tz");
    let engine = Engine::new(&persistence);
    let args =
        CliArgs::try_parse_from(["oxy", "log", "ls", "--week", "--tz", "Mars/Olympus"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert_eq!(result.unwrap_err().exit_code(), 2);
}

#[test]
fn test_given_timezone_far_ahead_of_utc_when_running_today_then_reports_local_calendar_date() {
    // Given
    let (payload_date, expected_date) = settled(
        "today_local_date",
        RangePreset::Today,
        "Pacific/Kiritimati",
        |persistence, range| {
            let engine = Engine::new(persistence);
            let args =
                CliArgs::try_parse_from(["oxy", "--json", "--tz", "Pacific/Kiritimati", "today"])
                    .unwrap();

            // When
            let output = handle_cli(args, persistence, &engine).unwrap();

            // Then
            let payload: serde_json::Value = serde_json::from_str(&format!("{output}")).unwrap();
            let date = payload["data"]["days"][0]["date"]
                .as_str()
                .unwrap()
                .to_string();
            (date, engine.local_date_of_range(range).unwrap())
        },
    );

    // Then
    assert_eq!(payload_date, expected_date);
}
