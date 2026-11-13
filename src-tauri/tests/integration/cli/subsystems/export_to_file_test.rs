use crate::shared::exporter_fixtures::create_sample_document;
use crate::shared::spreadsheet_helpers::{get_ods_cell_str, get_xlsx_cell_str};
use calamine::{Reader, Xlsx};
use oxyflow_timelog::cli::exporters::export_to_file;
use oxyflow_timelog::cli::parser::ExportFormat;
use oxyflow_timelog::types::{ReportDocument, ReportVariant};
use std::fs;

#[test]
fn test_given_destination_when_export_to_file_then_writes_file_and_creates_parents() {
    let document = create_sample_document(ReportVariant::Full);
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let target_file = temp_dir.path().join("subfolder").join("report.html");
    let target_path_str = target_file.to_str().unwrap();

    let res = export_to_file(&document, ExportFormat::Html, target_path_str);

    assert!(res.is_ok());
    assert!(target_file.exists());
    let content = fs::read_to_string(&target_file).expect("failed to read file");
    assert!(content.contains("<!DOCTYPE html>"));
}

#[test]
fn test_given_csv_format_when_export_to_file_then_writes_valid_csv_file() {
    let document = create_sample_document(ReportVariant::Full);
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let target_file = temp_dir.path().join("report.csv");
    let target_path_str = target_file.to_str().unwrap();

    let res = export_to_file(&document, ExportFormat::Csv, target_path_str);

    assert!(res.is_ok());
    assert!(target_file.exists());
    let content = fs::read_to_string(&target_file).expect("failed to read file");
    assert!(
        content.starts_with("Project,Task,Subtask,Duration_Seconds,Duration_Formatted,Percentage")
    );
    assert!(content.contains("\"API \"\"Service\"\"\""));
}

#[test]
fn test_given_json_format_when_export_to_file_then_writes_valid_json_file() {
    let document = create_sample_document(ReportVariant::Full);
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let target_file = temp_dir.path().join("report.json");
    let target_path_str = target_file.to_str().unwrap();

    let res = export_to_file(&document, ExportFormat::Json, target_path_str);

    assert!(res.is_ok());
    assert!(target_file.exists());
    let content = fs::read_to_string(&target_file).expect("failed to read file");
    assert!(content.ends_with(
        "}
"
    ));
    let parsed: ReportDocument = serde_json::from_str(&content).expect("bare ReportDocument");
    assert_eq!(parsed, document);
    assert!(content.contains("\"API \\\"Service\\\"\""));
}

#[test]
fn test_given_xml_format_when_export_to_file_then_writes_valid_xml_file() {
    let document = create_sample_document(ReportVariant::Full);
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let target_file = temp_dir.path().join("report.xml");
    let target_path_str = target_file.to_str().unwrap();

    let res = export_to_file(&document, ExportFormat::Xml, target_path_str);

    assert!(res.is_ok());
    assert!(target_file.exists());
    let content = fs::read_to_string(&target_file).expect("failed to read file");
    assert!(content.contains("<?xml"));
    assert!(content.contains("<report schemaVersion=\"1\">"));
}

#[test]
fn test_given_xlsx_format_when_export_to_file_then_writes_valid_excel_with_content() {
    let document = create_sample_document(ReportVariant::Full);
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let target_file = temp_dir.path().join("report.xlsx");
    let target_path_str = target_file.to_str().unwrap();

    let res = export_to_file(&document, ExportFormat::Xlsx, target_path_str);

    assert!(res.is_ok());
    assert!(target_file.exists());
    let mut excel: Xlsx<_> =
        calamine::open_workbook(&target_file).expect("failed to open exported file");
    let range = excel
        .worksheet_range("Work Report")
        .expect("must contain Work Report worksheet");

    assert_eq!(get_xlsx_cell_str(&range, 0, 0), "Project");
    assert_eq!(get_xlsx_cell_str(&range, 1, 1), "Database Setup");
}

#[test]
fn test_given_ods_format_when_export_to_file_then_writes_valid_ods_with_content() {
    let document = create_sample_document(ReportVariant::Full);
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let target_file = temp_dir.path().join("report.ods");
    let target_path_str = target_file.to_str().unwrap();

    let res = export_to_file(&document, ExportFormat::Ods, target_path_str);

    assert!(res.is_ok());
    assert!(target_file.exists());
    let ods = spreadsheet_ods::read_ods(&target_file).expect("failed to open exported file");
    let sheet = ods.sheet(0);
    assert_eq!(sheet.name(), "Work Report");
    assert_eq!(get_ods_cell_str(sheet, 0, 0), "Project");
    assert_eq!(get_ods_cell_str(sheet, 1, 1), "Database Setup");
}
