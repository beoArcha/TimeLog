use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::{setup_persistence_test, TempCsvDir};
use chrono::{DateTime, Datelike, Days, Utc};
use chrono_tz::Tz;
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::NewTimeLog;
use rusqlite::Connection;

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
    let end = start + chrono::Duration::hours(1);
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

fn utc_midnight(date: chrono::NaiveDate) -> DateTime<Utc> {
    date.and_hms_opt(0, 0, 0).unwrap().and_utc()
}

fn listed_ids(persistence: &Persistence, args: &[&str]) -> Vec<String> {
    let engine = Engine::new(persistence);
    let parsed = CliArgs::try_parse_from(args).unwrap();
    let rendered = format!("{}", handle_cli(parsed, persistence, &engine).unwrap());
    let rows: Vec<serde_json::Value> = serde_json::from_str(&rendered).expect("valid JSON array");
    rows.iter()
        .map(|row| row["note"].as_str().unwrap().to_string())
        .collect()
}

#[test]
fn test_given_logs_today_and_yesterday_when_listing_with_yesterday_preset_then_returns_only_yesterday(
) {
    // Given
    let (persistence, _conn, _temp) = setup("test_log_ls_yesterday_preset");
    let today = Utc::now().date_naive();
    insert_log(&persistence, "today", utc_midnight(today));
    let yesterday = today.checked_sub_days(Days::new(1)).unwrap();
    insert_log(
        &persistence,
        "yesterday",
        utc_midnight(yesterday) + chrono::Duration::hours(12),
    );

    // When
    let ids = listed_ids(
        &persistence,
        &["oxy", "--json", "log", "ls", "--yesterday", "--tz", "UTC"],
    );

    // Then
    assert_eq!(ids, vec!["yesterday"]);
}

#[test]
fn test_given_logs_around_week_boundary_when_listing_with_week_preset_then_week_starts_on_monday() {
    // Given
    let (persistence, _conn, _temp) = setup("test_log_ls_week_monday_start");
    let today = Utc::now().date_naive();
    let monday = today
        .checked_sub_days(Days::new(u64::from(today.weekday().num_days_from_monday())))
        .unwrap();
    insert_log(&persistence, "monday-start", utc_midnight(monday));
    let sunday_before = monday.checked_sub_days(Days::new(1)).unwrap();
    insert_log(
        &persistence,
        "sunday-before",
        utc_midnight(sunday_before) + chrono::Duration::hours(23),
    );

    // When
    let ids = listed_ids(
        &persistence,
        &["oxy", "--json", "log", "ls", "--week", "--tz", "UTC"],
    );

    // Then
    assert_eq!(ids, vec!["monday-start"]);
}

#[test]
fn test_given_log_exactly_at_to_bound_when_listing_with_instant_range_then_excludes_it() {
    // Given
    let (persistence, _conn, _temp) = setup("test_log_ls_exclusive_to");
    let boundary = DateTime::parse_from_rfc3339("2026-10-15T00:00:00Z")
        .unwrap()
        .with_timezone(&Utc);
    insert_log(&persistence, "at-to", boundary);
    insert_log(
        &persistence,
        "inside",
        boundary - chrono::Duration::hours(2),
    );

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
    let (persistence, _conn, _temp) = setup("test_log_ls_invalid_tz");
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
    let (persistence, _conn, _temp) = setup("test_today_local_date");
    let engine = Engine::new(&persistence);
    let args =
        CliArgs::try_parse_from(["oxy", "--json", "--tz", "Pacific/Kiritimati", "today"]).unwrap();

    // When
    let output = handle_cli(args, &persistence, &engine).unwrap();

    // Then
    let payload: serde_json::Value = serde_json::from_str(&format!("{output}")).unwrap();
    let expected = Utc::now()
        .with_timezone(&Tz::Pacific__Kiritimati)
        .format("%Y-%m-%d")
        .to_string();
    assert_eq!(payload["date"], expected);
}
