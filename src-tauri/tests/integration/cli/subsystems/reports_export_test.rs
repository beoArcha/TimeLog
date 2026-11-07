use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use calamine::{Data, Reader, Xlsx};
use clap::Parser;
use oxyflow_timelog::cli::formatters::ReportTreeDto;
use oxyflow_timelog::cli::{handle_cli, CliArgs};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::NewTimeLog;
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
fn test_given_logged_work_when_exporting_to_html_then_generates_valid_html_report_file() {
    // Arrange
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_html");
    let engine = Engine::new(&persistence);
    let output_file =
        std::env::temp_dir().join(format!("report_export_{}.html", uuid::Uuid::new_v4()));
    let output_path = output_file.to_str().unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "report", "export", "-f", "html", "-o", output_path])
            .unwrap();

    // Act
    let result = handle_cli(args, &persistence, &engine);

    // Assert
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
    // Arrange
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_csv");
    let engine = Engine::new(&persistence);
    let output_file =
        std::env::temp_dir().join(format!("report_export_{}.csv", uuid::Uuid::new_v4()));
    let output_path = output_file.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "report", "export", "-f", "csv", "-o", output_path])
        .unwrap();

    // Act
    let result = handle_cli(args, &persistence, &engine);

    // Assert
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
    // Arrange
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_json");
    let engine = Engine::new(&persistence);
    let output_file =
        std::env::temp_dir().join(format!("report_export_{}.json", uuid::Uuid::new_v4()));
    let output_path = output_file.to_str().unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "report", "export", "-f", "json", "-o", output_path])
            .unwrap();

    // Act
    let result = handle_cli(args, &persistence, &engine);

    // Assert
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
fn test_given_logged_work_when_exporting_to_xml_then_generates_valid_xml_report_file() {
    // Arrange
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_xml");
    let engine = Engine::new(&persistence);
    let output_file =
        std::env::temp_dir().join(format!("report_export_{}.xml", uuid::Uuid::new_v4()));
    let output_path = output_file.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "report", "export", "-f", "xml", "-o", output_path])
        .unwrap();

    // Act
    let result = handle_cli(args, &persistence, &engine);

    // Assert
    assert!(result.is_ok());
    assert!(output_file.exists());

    let content = fs::read_to_string(&output_file).expect("failed to read exported XML");
    assert!(content.starts_with("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
    assert!(content.contains("<report schemaVersion=\"1\">"));
    assert!(content.contains("<name>Export System</name>"));
    assert!(content.contains("<totalSeconds>7200</totalSeconds>"));

    let _ = fs::remove_file(output_file);
}

#[test]
fn test_given_logged_work_when_exporting_to_xlsx_then_generates_valid_xlsx_report_file() {
    // Arrange
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_xlsx");
    let engine = Engine::new(&persistence);
    let output_file =
        std::env::temp_dir().join(format!("report_export_{}.xlsx", uuid::Uuid::new_v4()));
    let output_path = output_file.to_str().unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "report", "export", "-f", "xlsx", "-o", output_path])
            .unwrap();

    // Act
    let result = handle_cli(args, &persistence, &engine);

    // Assert
    assert!(result.is_ok());
    assert!(output_file.exists());

    let mut excel: Xlsx<_> =
        calamine::open_workbook(&output_file).expect("failed to read exported XLSX");
    let range = excel
        .worksheet_range("Work Report")
        .expect("must contain Work Report worksheet");

    let get_cell_str = |r: usize, c: usize| match range.get((r, c)) {
        Some(Data::String(s)) => s.clone(),
        Some(Data::Float(f)) => f.to_string(),
        Some(Data::Int(i)) => i.to_string(),
        Some(Data::Empty) => String::new(),
        _ => String::new(),
    };

    // Header assertions
    assert_eq!(get_cell_str(0, 0), "Project");
    assert_eq!(get_cell_str(0, 1), "Task");
    assert_eq!(get_cell_str(0, 2), "Subtask");
    assert_eq!(get_cell_str(0, 3), "Duration_Seconds");
    assert_eq!(get_cell_str(0, 4), "Duration_Formatted");
    assert_eq!(get_cell_str(0, 5), "Percentage");

    // Row 1 assertions
    assert_eq!(get_cell_str(1, 0), "Export System");
    assert_eq!(get_cell_str(1, 1), "Invoice Generation");
    assert_eq!(get_cell_str(1, 2), "");
    let val_r1 = match range.get((1, 3)) {
        Some(Data::Int(i)) => *i as f64,
        Some(Data::Float(f)) => *f,
        _ => 0.0,
    };
    assert!((val_r1 - 7200.0).abs() < 0.1);
    assert_eq!(get_cell_str(1, 4), "02h 00m");

    // Total row assertions
    assert_eq!(get_cell_str(2, 0), "Total");
    let val_total = match range.get((2, 3)) {
        Some(Data::Int(i)) => *i as f64,
        Some(Data::Float(f)) => *f,
        _ => 0.0,
    };
    assert!((val_total - 7200.0).abs() < 0.1);
    assert_eq!(get_cell_str(2, 4), "02h 00m");

    let _ = fs::remove_file(output_file);
}

#[test]
fn test_given_logged_work_when_exporting_to_ods_then_generates_valid_ods_report_file() {
    // Arrange
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_ods");
    let engine = Engine::new(&persistence);
    let output_file =
        std::env::temp_dir().join(format!("report_export_{}.ods", uuid::Uuid::new_v4()));
    let output_path = output_file.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "report", "export", "-f", "ods", "-o", output_path])
        .unwrap();

    // Act
    let result = handle_cli(args, &persistence, &engine);

    // Assert
    assert!(result.is_ok());
    assert!(output_file.exists());

    let ods = spreadsheet_ods::read_ods(&output_file).expect("failed to read exported ODS");
    let sheet = ods.sheet(0);
    assert_eq!(sheet.name(), "Work Report");

    // Headers
    assert_eq!(sheet.value(0, 0).as_str_or(""), "Project");
    assert_eq!(sheet.value(0, 1).as_str_or(""), "Task");
    assert_eq!(sheet.value(0, 2).as_str_or(""), "Subtask");
    assert_eq!(sheet.value(0, 3).as_str_or(""), "Duration_Seconds");
    assert_eq!(sheet.value(0, 4).as_str_or(""), "Duration_Formatted");
    assert_eq!(sheet.value(0, 5).as_str_or(""), "Percentage");

    // Data Row 1
    assert_eq!(sheet.value(1, 0).as_str_or(""), "Export System");
    assert_eq!(sheet.value(1, 1).as_str_or(""), "Invoice Generation");
    assert_eq!(sheet.value(1, 2).as_str_or(""), "");
    assert_eq!(sheet.value(1, 3).as_f64_or(0.0), 7200.0);
    assert_eq!(sheet.value(1, 4).as_str_or(""), "02h 00m");
    assert_eq!(sheet.value(1, 5).as_f64_or(0.0), 100.0);

    // Total Row
    assert_eq!(sheet.value(2, 0).as_str_or(""), "Total");
    assert_eq!(sheet.value(2, 3).as_f64_or(0.0), 7200.0);
    assert_eq!(sheet.value(2, 4).as_str_or(""), "02h 00m");
    assert_eq!(sheet.value(2, 5).as_f64_or(0.0), 100.0);

    let _ = fs::remove_file(output_file);
}

#[test]
fn test_given_invalid_path_when_exporting_then_fails_with_sink_error_exit_code_1() {
    // Arrange
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

    // Act
    let result = handle_cli(args, &persistence, &engine);

    // Assert
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 1);
    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "SNK_EXTERNAL_IO");
}
