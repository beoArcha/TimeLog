use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;

#[test]
fn test_given_logs_across_projects_when_listing_with_project_filter_then_returns_matching_project_logs(
) {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_project_filter");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj1 = ProjectBuilder::new()
        .with_id("p-alpha")
        .with_name("Alpha Project")
        .build();
    let proj2 = ProjectBuilder::new()
        .with_id("p-beta")
        .with_name("Beta Project")
        .build();
    let task1 = TaskBuilder::new()
        .with_id("t-alpha-1")
        .with_project_id("p-alpha")
        .with_name("Alpha Task")
        .build();
    let task2 = TaskBuilder::new()
        .with_id("t-beta-1")
        .with_project_id("p-beta")
        .with_name("Beta Task")
        .build();

    persistence.projects.create(proj1).unwrap();
    persistence.projects.create(proj2).unwrap();
    persistence.tasks.create(task1).unwrap();
    persistence.tasks.create(task2).unwrap();

    let add1 =
        CliArgs::try_parse_from(["oxy", "log", "add", "Alpha Task", "20m", "Alpha work"]).unwrap();
    let add2 =
        CliArgs::try_parse_from(["oxy", "log", "add", "Beta Task", "40m", "Beta work"]).unwrap();
    handle_cli(add1, &persistence, &engine).unwrap();
    handle_cli(add2, &persistence, &engine).unwrap();

    let list_args =
        CliArgs::try_parse_from(["oxy", "--json", "log", "ls", "-p", "Alpha Project"]).unwrap();

    // When
    let result = handle_cli(list_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    let items = parsed["data"]["items"].as_array().unwrap();
    assert_eq!(items.len(), 1);
    assert_eq!(items[0]["taskId"], "t-alpha-1");
    assert_eq!(items[0]["note"], "Alpha work");
}

#[test]
fn test_given_logs_across_dates_when_listing_with_from_to_filter_then_returns_logs_in_range() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_date_range_filter");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-range")
        .with_name("Range Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-range")
        .with_project_id("p-range")
        .with_name("Range Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    // Log 1: Early October (outside)
    let add1 = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Range Task",
        "--from",
        "2026-10-02T10:00:00Z",
        "--to",
        "2026-10-02T11:00:00Z",
        "--note",
        "Early",
    ])
    .unwrap();
    // Log 2: Mid October (inside)
    let add2 = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Range Task",
        "--from",
        "2026-10-15T10:00:00Z",
        "--to",
        "2026-10-15T11:00:00Z",
        "--note",
        "Mid",
    ])
    .unwrap();
    // Log 3: Late October (outside)
    let add3 = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Range Task",
        "--from",
        "2026-10-28T10:00:00Z",
        "--to",
        "2026-10-28T11:00:00Z",
        "--note",
        "Late",
    ])
    .unwrap();

    handle_cli(add1, &persistence, &engine).unwrap();
    handle_cli(add2, &persistence, &engine).unwrap();
    handle_cli(add3, &persistence, &engine).unwrap();

    let filter_args = CliArgs::try_parse_from([
        "oxy",
        "--json",
        "log",
        "ls",
        "--from",
        "2026-10-10",
        "--to",
        "2026-10-20",
    ])
    .unwrap();

    // When
    let result = handle_cli(filter_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    let items = parsed["data"]["items"].as_array().unwrap();
    assert_eq!(items.len(), 1);
    assert_eq!(items[0]["note"], "Mid");
}

#[test]
fn test_given_logs_when_listing_with_month_flag_then_returns_current_month_entries() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_log_month_filter");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-month")
        .with_name("Month Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-month")
        .with_project_id("p-month")
        .with_name("Month Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let add_current =
        CliArgs::try_parse_from(["oxy", "log", "add", "Month Task", "30m", "Current entry"])
            .unwrap();
    let add_past = CliArgs::try_parse_from([
        "oxy",
        "log",
        "add",
        "Month Task",
        "--from",
        "2025-01-10T10:00:00Z",
        "--to",
        "2025-01-10T11:00:00Z",
        "--note",
        "Past entry",
    ])
    .unwrap();

    handle_cli(add_current, &persistence, &engine).unwrap();
    handle_cli(add_past, &persistence, &engine).unwrap();

    let list_args = CliArgs::try_parse_from(["oxy", "--json", "log", "ls", "--month"]).unwrap();

    // When
    let result = handle_cli(list_args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    let items = parsed["data"]["items"].as_array().unwrap();
    assert_eq!(items.len(), 1);
    assert_eq!(items[0]["note"], "Current entry");
}
