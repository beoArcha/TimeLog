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

fn setup_dataset(db_name: &str) -> (Persistence, Connection, crate::shared::test_db::TempCsvDir) {
    let (conn, config, temp_dir) = setup_persistence_test(db_name);
    let persistence = Persistence::new(&config).expect("failed to create persistence layer");

    let project = ProjectBuilder::new()
        .with_id("p_rep_sub_01")
        .with_name("Export System")
        .with_color("teal")
        .build();
    let task = TaskBuilder::new()
        .with_id("t_rep_sub_01")
        .with_project_id("p_rep_sub_01")
        .with_name("Invoice Generation")
        .build();

    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();

    let now_utc = chrono::Utc::now();
    let start_iso = (now_utc - chrono::Duration::hours(3)).to_rfc3339();
    let end_iso = (now_utc - chrono::Duration::hours(1)).to_rfc3339();

    let new_log = NewTimeLog {
        id: "log_rep_sub_01".to_string(),
        task_id: "t_rep_sub_01".to_string(),
        start_time: start_iso,
        end_time: Some(end_iso),
        note: Some("Quarterly financial report".to_string()),
    };
    persistence.time_logs.insert_full(&new_log).unwrap();

    (persistence, conn, temp_dir)
}

#[test]
fn test_given_logged_work_when_report_tree_invoked_then_outputs_unicode_tree() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_reports_tree_unicode");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "report", "--tree"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let display_str = result.unwrap().to_string();
    assert!(display_str.contains("Export System"));
    assert!(display_str.contains("Invoice Generation"));
    assert!(display_str.contains("02h 00m"));
    assert!(display_str.contains("█"));
}

#[test]
fn test_given_logged_work_when_report_invoked_with_machine_flag_then_outputs_clean_json_tree() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_reports_machine_json");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "-m", "report"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    match result.unwrap() {
        CliOutput::Json(ref json_str) => {
            let tree: ReportTreeDto =
                serde_json::from_str(json_str).expect("output must be valid ReportTreeDto JSON");
            assert_eq!(tree.projects.len(), 1);
            assert_eq!(tree.projects[0].name, "Export System");
            assert_eq!(tree.total_seconds, 7200);
        }
        other => panic!("Expected CliOutput::Json, got {:?}", other),
    }
}

#[test]
fn test_given_logged_work_when_exporting_to_html_then_generates_valid_html_report_file() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_html");
    let engine = Engine::new(&persistence);
    let output_file =
        std::env::temp_dir().join(format!("report_export_{}.html", uuid::Uuid::new_v4()));
    let output_path = output_file.to_str().unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "report", "export", "-f", "html", "-o", output_path])
            .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    assert!(output_file.exists());

    let content = fs::read_to_string(&output_file).expect("failed to read exported HTML");
    assert!(content.contains("<!DOCTYPE html>"));
    assert!(content.contains("Export System"));
    assert!(content.contains("Invoice Generation"));
    assert!(content.contains("02h 00m"));

    let _ = fs::remove_file(output_file);
}

#[test]
fn test_given_logged_work_when_exporting_to_csv_then_generates_valid_tabular_csv_file() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_csv");
    let engine = Engine::new(&persistence);
    let output_file =
        std::env::temp_dir().join(format!("report_export_{}.csv", uuid::Uuid::new_v4()));
    let output_path = output_file.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "report", "export", "-f", "csv", "-o", output_path])
        .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    assert!(output_file.exists());

    let content = fs::read_to_string(&output_file).expect("failed to read exported CSV");
    assert!(content.contains("Project,Task,Subtask,Duration_Seconds,Duration_Formatted,Percentage"));
    assert!(content.contains("Export System"));
    assert!(content.contains("Invoice Generation"));
    assert!(content.contains("7200"));

    let _ = fs::remove_file(output_file);
}

#[test]
fn test_given_logged_work_when_exporting_to_json_then_generates_valid_json_report_file() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_json");
    let engine = Engine::new(&persistence);
    let output_file =
        std::env::temp_dir().join(format!("report_export_{}.json", uuid::Uuid::new_v4()));
    let output_path = output_file.to_str().unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "report", "export", "-f", "json", "-o", output_path])
            .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    assert!(output_file.exists());

    let content = fs::read_to_string(&output_file).expect("failed to read exported JSON");
    let tree: ReportTreeDto =
        serde_json::from_str(&content).expect("content must parse into ReportTreeDto");
    assert_eq!(tree.projects.len(), 1);
    assert_eq!(tree.projects[0].name, "Export System");
    assert_eq!(tree.total_seconds, 7200);

    let _ = fs::remove_file(output_file);
}

#[test]
fn test_given_invalid_path_when_exporting_then_fails_with_sink_error_exit_code_1() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_io_err");
    let engine = Engine::new(&persistence);
    let invalid_path = if cfg!(windows) {
        "Z:\\non_existent_drive_xyz\\report.csv"
    } else {
        "/non_existent_dir_xyz/deeply/nested/report.csv"
    };

    let args =
        CliArgs::try_parse_from(["oxy", "report", "export", "-f", "csv", "-o", invalid_path])
            .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 1);
    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "SNK_EXTERNAL_IO");
}
