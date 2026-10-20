use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::formatters::ReportTreeDto;
use oxy_flow::cli::{handle_cli, CliArgs, CliOutput};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::NewTimeLog;
use rusqlite::Connection;
use std::fs;

fn setup(db_name: &str) -> (Persistence, Connection, crate::shared::test_db::TempCsvDir) {
    let (conn, config, temp_dir) = setup_persistence_test(db_name);
    let persistence = Persistence::new(&config).expect("failed to create persistence layer");

    let project = ProjectBuilder::new()
        .with_id("p-report-01")
        .with_name("Core API")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-report-01")
        .with_project_id("p-report-01")
        .with_name("Authentication Flow")
        .build();

    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();

    let now_utc = chrono::Utc::now();
    let start_iso = (now_utc - chrono::Duration::hours(2)).to_rfc3339();
    let end_iso = (now_utc - chrono::Duration::hours(1)).to_rfc3339();

    let new_log = NewTimeLog {
        id: "log-report-01".to_string(),
        task_id: "t-report-01".to_string(),
        start_time: start_iso,
        end_time: Some(end_iso),
        note: Some("Initial auth test".to_string()),
    };
    persistence.time_logs.insert_full(&new_log).unwrap();

    (persistence, conn, temp_dir)
}

#[test]
fn test_given_logged_work_when_report_tree_invoked_then_outputs_unicode_tree() {
    // Given
    let (persistence, _conn, _temp) = setup("test_report_tree");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "report", "--tree"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let output = result.unwrap();
    let display_str = output.to_string();
    assert!(display_str.contains("Core API"));
    assert!(display_str.contains("Authentication Flow"));
    assert!(display_str.contains("01h 00m"));
    assert!(display_str.contains("█"));
}

#[test]
fn test_given_logged_work_when_report_invoked_with_machine_flag_then_outputs_clean_json_tree() {
    // Given
    let (persistence, _conn, _temp) = setup("test_report_machine");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "-m", "report"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let output = result.unwrap();
    match output {
        CliOutput::Json(ref json_str) => {
            let tree: ReportTreeDto =
                serde_json::from_str(json_str).expect("output must be valid ReportTreeDto JSON");
            assert_eq!(tree.projects.len(), 1);
            assert_eq!(tree.projects[0].name, "Core API");
            assert_eq!(tree.total_seconds, 3600);
        }
        other => panic!("Expected CliOutput::Json, got {:?}", other),
    }
}

#[test]
fn test_given_logged_work_when_report_exported_to_csv_then_creates_valid_csv_file() {
    // Given
    let (persistence, _conn, _temp) = setup("test_report_export_csv");
    let engine = Engine::new(&persistence);
    let temp_file = std::env::temp_dir().join(format!("report_test_{}.csv", uuid::Uuid::new_v4()));
    let temp_path = temp_file.to_str().unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "report", "export", "-f", "csv", "-o", temp_path]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    assert!(temp_file.exists());
    let content = fs::read_to_string(&temp_file).expect("failed to read exported csv");
    assert!(content.contains("Core API"));
    assert!(content.contains("Authentication Flow"));
    assert!(content.contains("3600"));

    // Cleanup
    let _ = fs::remove_file(temp_file);
}

#[test]
fn test_given_logged_work_when_today_invoked_with_json_flag_then_outputs_clean_json_summary() {
    // Given
    let (persistence, _conn, _temp) = setup("test_today_json");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "-j", "today"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let output = result.unwrap();
    match output {
        CliOutput::Json(ref json_str) => {
            assert!(json_str.contains("\"date\""));
            assert!(json_str.contains("\"total_seconds\""));
            assert!(json_str.contains("\"entries\""));
        }
        other => panic!("Expected CliOutput::Json, got {:?}", other),
    }
}

#[test]
fn test_given_running_timer_when_status_invoked_with_machine_flag_then_outputs_json_status() {
    // Given
    let (persistence, _conn, _temp) = setup("test_status_machine");
    let engine = Engine::new(&persistence);
    engine.start_timer("t-report-01").unwrap();

    let args = CliArgs::try_parse_from(["oxy", "--machine", "status"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let output = result.unwrap();
    match output {
        CliOutput::Json(ref json_str) => {
            assert!(json_str.contains("\"running\":true"));
            assert!(json_str.contains("t-report-01"));
        }
        other => panic!("Expected CliOutput::Json, got {:?}", other),
    }
}
