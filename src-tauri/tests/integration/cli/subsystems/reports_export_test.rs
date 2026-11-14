use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use crate::shared::xsd_validator::assert_valid_report_xml;
use calamine::{Reader, Xlsx};
use clap::Parser;
use oxyflow_timelog::cli::handlers::report_handler;
use oxyflow_timelog::cli::parser::CliCommand;
use oxyflow_timelog::cli::shared::output::CliOutput;
use oxyflow_timelog::cli::{handle_cli, CliArgs};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::{NewTimeLog, ReportDocument};
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
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_html");
    let engine = Engine::new(&persistence);
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let output_file = temp_dir.path().join("report.html");
    let output_path = output_file.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "report", "-f", "html", "-o", output_path]).unwrap();

    let result = handle_cli(args, &persistence, &engine);

    assert!(result.is_ok());
    assert!(output_file.exists());

    let content = fs::read_to_string(&output_file).expect("failed to read exported HTML");
    assert!(content.contains("<!DOCTYPE html>"));
    assert!(content.contains("Export System"));
    assert!(content.contains("Invoice Generation"));
    assert!(content.contains("02h 00m"));
}

#[test]
fn test_given_logged_work_when_exporting_to_csv_then_generates_valid_tabular_csv_file() {
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_csv");
    let engine = Engine::new(&persistence);
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let output_file = temp_dir.path().join("report.csv");
    let output_path = output_file.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "report", "-f", "csv", "-o", output_path]).unwrap();

    let result = handle_cli(args, &persistence, &engine);

    assert!(result.is_ok());
    assert!(output_file.exists());

    let content = fs::read_to_string(&output_file).expect("failed to read exported CSV");
    assert!(content.starts_with("entryId,projectId,projectName,"));
    assert!(content.contains("Export System"));
    assert!(content.contains("Invoice Generation"));
    assert!(content.contains("log_rep_sub_01"));
    assert!(content.contains("Quarterly financial report"));
    assert!(content.contains(",7200,"));
}

#[test]
fn test_given_logged_work_when_exporting_to_json_then_generates_valid_json_report_file() {
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_json");
    let engine = Engine::new(&persistence);
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let output_file = temp_dir.path().join("report.json");
    let output_path = output_file.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "report", "-f", "json", "-o", output_path]).unwrap();

    let result = handle_cli(args, &persistence, &engine);

    assert!(result.is_ok());
    assert!(output_file.exists());

    let content = fs::read_to_string(&output_file).expect("failed to read exported JSON");
    let document: ReportDocument =
        serde_json::from_str(&content).expect("content must parse into ReportDocument");
    assert_eq!(document.projects.len(), 1);
    assert_eq!(document.projects[0].name, "Export System");
    assert_eq!(document.totals.seconds, 7200);
}

#[test]
fn test_given_logged_work_when_exporting_to_jsonl_then_writes_header_and_entry_lines_to_file() {
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_jsonl");
    let engine = Engine::new(&persistence);
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let output_file = temp_dir.path().join("report.jsonl");
    let output_path = output_file.to_str().unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "report", "-f", "jsonl", "-o", output_path]).unwrap();

    let result = handle_cli(args, &persistence, &engine);

    assert!(result.is_ok());
    let content = fs::read_to_string(&output_file).expect("failed to read exported JSONL");
    let lines: Vec<serde_json::Value> = content
        .lines()
        .map(|line| serde_json::from_str(line).expect("every line is JSON"))
        .collect();
    assert_eq!(lines.len(), 2);
    assert_eq!(lines[0]["type"], "header");
    assert_eq!(lines[0]["totals"]["seconds"], 7200);
    assert_eq!(lines[1]["type"], "entry");
    assert_eq!(lines[1]["projectName"], "Export System");
    assert_eq!(lines[1]["seconds"], 7200);
}

#[test]
fn test_given_logged_work_when_reporting_jsonl_to_stdout_then_output_is_the_jsonl_stream() {
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_jsonl_stdout");
    let engine = Engine::new(&persistence);

    let args = CliArgs::try_parse_from(["oxy", "report", "-f", "jsonl", "-o", "-"]).unwrap();
    let report_args = match args.command {
        Some(CliCommand::Report(report)) => report,
        other => panic!("expected a report command, got {other:?}"),
    };

    let output = report_handler::handle(
        report_args,
        false,
        false,
        false,
        &persistence,
        &engine,
        None,
    )
    .expect("jsonl to stdout");

    let CliOutput::Bytes(bytes) = output else {
        panic!("expected the raw export bytes for -o -");
    };
    let text = String::from_utf8(bytes).expect("JSONL is UTF-8");
    assert!(text.ends_with('\n'));
    let lines: Vec<serde_json::Value> = text
        .lines()
        .map(|line| serde_json::from_str(line).expect("every line is JSON"))
        .collect();
    assert_eq!(lines.len(), 2);
    assert_eq!(lines[0]["type"], "header");
    assert_eq!(lines[1]["type"], "entry");
}

#[test]
fn test_given_logged_work_when_exporting_to_xml_then_generates_valid_xml_report_file() {
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_xml");
    let engine = Engine::new(&persistence);
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let output_file = temp_dir.path().join("report.xml");
    let output_path = output_file.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "report", "-f", "xml", "-o", output_path]).unwrap();

    let result = handle_cli(args, &persistence, &engine);

    assert!(result.is_ok());
    assert!(output_file.exists());

    let content = fs::read_to_string(&output_file).expect("failed to read exported XML");
    assert!(content.starts_with("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
    assert_valid_report_xml(&content);
    assert!(content.contains("<report schema=\"oxy.report\" schemaVersion=\"2\" variant=\"full\">"));
    assert!(content.contains("<name>Export System</name>"));
    assert!(content.contains("<totals seconds=\"7200\""));
}

#[test]
fn test_given_logged_work_when_exporting_to_xlsx_then_generates_valid_xlsx_report_file() {
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_xlsx");
    let engine = Engine::new(&persistence);
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let output_file = temp_dir.path().join("report.xlsx");
    let output_path = output_file.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "report", "-f", "xlsx", "-o", output_path]).unwrap();

    let result = handle_cli(args, &persistence, &engine);

    assert!(result.is_ok());
    assert!(output_file.exists());

    let mut excel: Xlsx<_> =
        calamine::open_workbook(&output_file).expect("failed to read exported XLSX");
    let range = excel
        .worksheet_range("Work Report")
        .expect("must contain Work Report worksheet");

    // Header assertions
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_xlsx_cell_str(&range, 0, 0),
        "Project"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_xlsx_cell_str(&range, 0, 1),
        "Task"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_xlsx_cell_str(&range, 0, 2),
        "Subtask"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_xlsx_cell_str(&range, 0, 3),
        "Duration_Seconds"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_xlsx_cell_str(&range, 0, 4),
        "Duration_Formatted"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_xlsx_cell_str(&range, 0, 5),
        "Percentage"
    );

    // Row 1 assertions
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_xlsx_cell_str(&range, 1, 0),
        "Export System"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_xlsx_cell_str(&range, 1, 1),
        "Invoice Generation"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_xlsx_cell_str(&range, 1, 2),
        ""
    );
    assert!(
        (crate::shared::spreadsheet_helpers::get_xlsx_cell_f64(&range, 1, 3) - 7200.0).abs() < 0.1
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_xlsx_cell_str(&range, 1, 4),
        "02h 00m"
    );

    // Total row assertions
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_xlsx_cell_str(&range, 2, 0),
        "Total"
    );
    assert!(
        (crate::shared::spreadsheet_helpers::get_xlsx_cell_f64(&range, 2, 3) - 7200.0).abs() < 0.1
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_xlsx_cell_str(&range, 2, 4),
        "02h 00m"
    );
}

#[test]
fn test_given_logged_work_when_exporting_to_ods_then_generates_valid_ods_report_file() {
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_ods");
    let engine = Engine::new(&persistence);
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let output_file = temp_dir.path().join("report.ods");
    let output_path = output_file.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "report", "-f", "ods", "-o", output_path]).unwrap();

    let result = handle_cli(args, &persistence, &engine);

    assert!(result.is_ok());
    assert!(output_file.exists());

    let ods = spreadsheet_ods::read_ods(&output_file).expect("failed to read exported ODS");
    let sheet = ods.sheet(0);
    assert_eq!(sheet.name(), "Work Report");

    // Headers
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_str(sheet, 0, 0),
        "Project"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_str(sheet, 0, 1),
        "Task"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_str(sheet, 0, 2),
        "Subtask"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_str(sheet, 0, 3),
        "Duration_Seconds"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_str(sheet, 0, 4),
        "Duration_Formatted"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_str(sheet, 0, 5),
        "Percentage"
    );

    // Data Row 1
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_str(sheet, 1, 0),
        "Export System"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_str(sheet, 1, 1),
        "Invoice Generation"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_str(sheet, 1, 2),
        ""
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_f64(sheet, 1, 3),
        7200.0
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_str(sheet, 1, 4),
        "02h 00m"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_f64(sheet, 1, 5),
        100.0
    );

    // Total Row
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_str(sheet, 2, 0),
        "Total"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_f64(sheet, 2, 3),
        7200.0
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_str(sheet, 2, 4),
        "02h 00m"
    );
    assert_eq!(
        crate::shared::spreadsheet_helpers::get_ods_cell_f64(sheet, 2, 5),
        100.0
    );
}

#[test]
fn test_given_invalid_path_when_exporting_then_fails_with_sink_error_exit_code_1() {
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_io_err");
    let engine = Engine::new(&persistence);
    let invalid_path = if cfg!(windows) {
        "Z:\\non_existent_drive_xyz\\report.csv"
    } else {
        "/non_existent_dir_xyz/deeply/nested/report.csv"
    };

    let args = CliArgs::try_parse_from(["oxy", "report", "-f", "csv", "-o", invalid_path]).unwrap();

    let result = handle_cli(args, &persistence, &engine);

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 1);
    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "SNK_EXTERNAL_IO");
}
