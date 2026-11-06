use oxyflow_timelog::cli::exporters::{
    export_csv, export_html, export_json, export_ods, export_to_file, export_xlsx, export_xml,
};
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
    }
}

#[test]
fn test_given_tree_when_export_html_then_contains_responsive_markup_and_escaped_entities() {
    // Arrange
    let tree = create_sample_tree();

    // Act
    let html = export_html(&tree);

    // Assert
    assert!(html.contains("<!DOCTYPE html>"));
    assert!(html.contains("API &quot;Service&quot;"));
    assert!(html.contains("Database Setup"));
    assert!(html.contains("01h 00m"));
    assert!(html.contains("oXyFlow Work Report"));
}

#[test]
fn test_given_tree_when_export_csv_then_contains_header_and_rfc4180_quotes() {
    // Arrange
    let tree = create_sample_tree();

    // Act
    let csv = export_csv(&tree);

    // Assert
    assert!(csv.starts_with("Project,Task,Subtask,Duration_Seconds,Duration_Formatted,Percentage"));
    assert!(csv.contains("\"API \"\"Service\"\"\""));
    assert!(csv.contains("\"Database Setup\""));
    assert!(csv.contains("3600"));
}

#[test]
fn test_given_tree_when_export_json_then_produces_pretty_printed_schema() {
    // Arrange
    let tree = create_sample_tree();

    // Act
    let json = export_json(&tree).expect("json export should succeed");

    // Assert
    assert!(json.contains("\"period\": \"Today\""));
    assert!(json.contains("\"total_seconds\": 3600"));
    assert!(json.contains("\"projects\": ["));
}

#[test]
fn test_given_tree_when_export_xml_then_produces_well_formed_xml() {
    // Arrange
    let tree = create_sample_tree();

    // Act
    let xml = export_xml(&tree).expect("xml export should succeed");

    // Assert
    assert!(xml.starts_with("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
    assert!(xml.contains("<period>Today</period>"));
    assert!(xml.contains("<total_seconds>3600</total_seconds>"));
    assert!(xml.contains("<name>Database Setup</name>"));
}

#[test]
fn test_given_tree_when_export_xlsx_then_produces_valid_excel_bytes() {
    // Arrange
    let tree = create_sample_tree();

    // Act
    let bytes = export_xlsx(&tree).expect("xlsx export should succeed");

    // Assert
    assert!(!bytes.is_empty());
    assert_eq!(&bytes[0..4], &[0x50, 0x4B, 0x03, 0x04]);
}

#[test]
fn test_given_tree_when_export_ods_then_produces_valid_ods_bytes() {
    // Arrange
    let tree = create_sample_tree();

    // Act
    let bytes = export_ods(&tree).expect("ods export should succeed");

    // Assert
    assert!(!bytes.is_empty());
    assert_eq!(&bytes[0..4], &[0x50, 0x4B, 0x03, 0x04]);
}

#[test]
fn test_given_destination_when_export_to_file_then_writes_file_and_creates_parents() {
    // Arrange
    let tree = create_sample_tree();
    let temp_dir = std::env::temp_dir().join(format!("oxy_test_export_{}", uuid::Uuid::new_v4()));
    let target_file = temp_dir.join("subfolder").join("report.html");
    let target_path_str = target_file.to_str().unwrap();

    // Act
    let res = export_to_file(&tree, ExportFormat::Html, target_path_str);

    // Assert
    assert!(res.is_ok());
    assert!(target_file.exists());
    let content = fs::read_to_string(&target_file).expect("failed to read file");
    assert!(content.contains("<!DOCTYPE html>"));

    // Cleanup
    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_given_xml_format_when_export_to_file_then_writes_xml_file() {
    // Arrange
    let tree = create_sample_tree();
    let temp_dir =
        std::env::temp_dir().join(format!("oxy_test_export_xml_{}", uuid::Uuid::new_v4()));
    let target_file = temp_dir.join("report.xml");
    let target_path_str = target_file.to_str().unwrap();

    // Act
    let res = export_to_file(&tree, ExportFormat::Xml, target_path_str);

    // Assert
    assert!(res.is_ok());
    assert!(target_file.exists());
    let content = fs::read_to_string(&target_file).expect("failed to read file");
    assert!(content.contains("<?xml"));

    // Cleanup
    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_given_xlsx_format_when_export_to_file_then_writes_binary_excel_file() {
    // Arrange
    let tree = create_sample_tree();
    let temp_dir =
        std::env::temp_dir().join(format!("oxy_test_export_xlsx_{}", uuid::Uuid::new_v4()));
    let target_file = temp_dir.join("report.xlsx");
    let target_path_str = target_file.to_str().unwrap();

    // Act
    let res = export_to_file(&tree, ExportFormat::Xlsx, target_path_str);

    // Assert
    assert!(res.is_ok());
    assert!(target_file.exists());
    let bytes = fs::read(&target_file).expect("failed to read file");
    assert_eq!(&bytes[0..4], &[0x50, 0x4B, 0x03, 0x04]);

    // Cleanup
    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_given_ods_format_when_export_to_file_then_writes_binary_ods_file() {
    // Arrange
    let tree = create_sample_tree();
    let temp_dir =
        std::env::temp_dir().join(format!("oxy_test_export_ods_{}", uuid::Uuid::new_v4()));
    let target_file = temp_dir.join("report.ods");
    let target_path_str = target_file.to_str().unwrap();

    // Act
    let res = export_to_file(&tree, ExportFormat::Ods, target_path_str);

    // Assert
    assert!(res.is_ok());
    assert!(target_file.exists());
    let bytes = fs::read(&target_file).expect("failed to read file");
    assert_eq!(&bytes[0..4], &[0x50, 0x4B, 0x03, 0x04]);

    // Cleanup
    let _ = fs::remove_dir_all(temp_dir);
}
