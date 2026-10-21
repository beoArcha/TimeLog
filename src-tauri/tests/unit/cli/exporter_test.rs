use oxy_flow::cli::exporters::{export_csv, export_html, export_json, export_to_file};
use oxy_flow::cli::formatters::{ReportProjectDto, ReportTaskDto, ReportTreeDto};
use oxy_flow::cli::parser::ExportFormat;
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
    let json = export_json(&tree);

    // Assert
    assert!(json.contains("\"period\": \"Today\""));
    assert!(json.contains("\"total_seconds\": 3600"));
    assert!(json.contains("\"projects\": ["));
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
fn test_given_unsupported_format_when_export_to_file_then_returns_syntax_error() {
    // Arrange
    let tree = create_sample_tree();
    let target_path = "output.ods";

    // Act
    let res = export_to_file(&tree, ExportFormat::Ods, target_path);

    // Assert
    assert!(res.is_err());
    let err = res.unwrap_err();
    assert!(err.to_string().contains("not supported"));
}
