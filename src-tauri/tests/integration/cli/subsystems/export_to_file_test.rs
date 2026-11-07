use calamine::{Data, Reader, Xlsx};
use oxyflow_timelog::cli::exporters::export_to_file;
use oxyflow_timelog::cli::formatters::{ReportProjectDto, ReportTaskDto, ReportTreeDto};
use oxyflow_timelog::cli::parser::ExportFormat;
use std::fs;

fn create_sample_tree() -> ReportTreeDto {
    ReportTreeDto {
        period: "Today".to_string(),
        total_seconds: 3600,
        total_formatted: "01h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "p1".to_string(),
            name: "API \"Service\"".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t1".to_string(),
                name: "Database Setup".to_string(),
                duration_seconds: 3600,
                duration_formatted: "01h 00m".to_string(),
                percentage: 100.0,
                subtasks: vec![],
            }],
        }],
        entries: vec![],
    }
}

#[test]
fn test_given_destination_when_export_to_file_then_writes_file_and_creates_parents() {
    // Given
    let tree = create_sample_tree();
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let target_file = temp_dir.path().join("subfolder").join("report.html");
    let target_path_str = target_file.to_str().unwrap();

    // When
    let res = export_to_file(&tree, ExportFormat::Html, target_path_str);

    // Then
    assert!(res.is_ok());
    assert!(target_file.exists());
    let content = fs::read_to_string(&target_file).expect("failed to read file");
    assert!(content.contains("<!DOCTYPE html>"));
}

#[test]
fn test_given_csv_format_when_export_to_file_then_writes_valid_csv_file() {
    // Given
    let tree = create_sample_tree();
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let target_file = temp_dir.path().join("report.csv");
    let target_path_str = target_file.to_str().unwrap();

    // When
    let res = export_to_file(&tree, ExportFormat::Csv, target_path_str);

    // Then
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
    // Given
    let tree = create_sample_tree();
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let target_file = temp_dir.path().join("report.json");
    let target_path_str = target_file.to_str().unwrap();

    // When
    let res = export_to_file(&tree, ExportFormat::Json, target_path_str);

    // Then
    assert!(res.is_ok());
    assert!(target_file.exists());
    let content = fs::read_to_string(&target_file).expect("failed to read file");
    assert!(content.contains("\"period\": \"Today\""));
    assert!(content.contains("\"API \\\"Service\\\"\""));
}

#[test]
fn test_given_xml_format_when_export_to_file_then_writes_valid_xml_file() {
    // Given
    let tree = create_sample_tree();
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let target_file = temp_dir.path().join("report.xml");
    let target_path_str = target_file.to_str().unwrap();

    // When
    let res = export_to_file(&tree, ExportFormat::Xml, target_path_str);

    // Then
    assert!(res.is_ok());
    assert!(target_file.exists());
    let content = fs::read_to_string(&target_file).expect("failed to read file");
    assert!(content.contains("<?xml"));
    assert!(content.contains("<report schemaVersion=\"1\">"));
}

#[test]
fn test_given_xlsx_format_when_export_to_file_then_writes_valid_excel_with_content() {
    // Given
    let tree = create_sample_tree();
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let target_file = temp_dir.path().join("report.xlsx");
    let target_path_str = target_file.to_str().unwrap();

    // When
    let res = export_to_file(&tree, ExportFormat::Xlsx, target_path_str);

    // Then
    assert!(res.is_ok());
    assert!(target_file.exists());
    let mut excel: Xlsx<_> =
        calamine::open_workbook(&target_file).expect("failed to open exported file");
    let range = excel
        .worksheet_range("Work Report")
        .expect("must contain Work Report worksheet");
    let get_cell = |r: usize, c: usize| match range.get((r, c)) {
        Some(Data::String(s)) => s.clone(),
        Some(Data::Float(f)) => f.to_string(),
        Some(Data::Int(i)) => i.to_string(),
        _ => String::new(),
    };
    assert_eq!(get_cell(0, 0), "Project");
    assert_eq!(get_cell(1, 1), "Database Setup");
}

#[test]
fn test_given_ods_format_when_export_to_file_then_writes_valid_ods_with_content() {
    // Given
    let tree = create_sample_tree();
    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let target_file = temp_dir.path().join("report.ods");
    let target_path_str = target_file.to_str().unwrap();

    // When
    let res = export_to_file(&tree, ExportFormat::Ods, target_path_str);

    // Then
    assert!(res.is_ok());
    assert!(target_file.exists());
    let ods = spreadsheet_ods::read_ods(&target_file).expect("failed to open exported file");
    let sheet = ods.sheet(0);
    assert_eq!(sheet.name(), "Work Report");
    assert_eq!(sheet.value(0, 0).as_str_or(""), "Project");
    assert_eq!(sheet.value(1, 1).as_str_or(""), "Database Setup");
}
