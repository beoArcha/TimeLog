use oxyflow_timelog::cli::exporters::{export_json, export_to_file};
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

fn create_empty_tree() -> ReportTreeDto {
    ReportTreeDto {
        period: "Today".to_string(),
        total_seconds: 0,
        total_formatted: "00m 00s".to_string(),
        projects: vec![],
    }
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
fn test_given_empty_tree_when_export_json_then_produces_valid_empty_json() {
    // Arrange
    let tree = create_empty_tree();

    // Act
    let json = export_json(&tree).expect("json export should succeed");

    // Assert
    let parsed: ReportTreeDto =
        serde_json::from_str(&json).expect("must parse back into ReportTreeDto");
    assert_eq!(parsed.total_seconds, 0);
    assert!(parsed.projects.is_empty());
}

#[test]
fn test_given_json_format_when_export_to_file_then_writes_valid_json_file() {
    // Arrange
    let tree = create_sample_tree();
    let temp_dir =
        std::env::temp_dir().join(format!("oxy_test_export_json_{}", uuid::Uuid::new_v4()));
    let target_file = temp_dir.join("report.json");
    let target_path_str = target_file.to_str().unwrap();

    // Act
    let res = export_to_file(&tree, ExportFormat::Json, target_path_str);

    // Assert
    assert!(res.is_ok());
    assert!(target_file.exists());
    let content = fs::read_to_string(&target_file).expect("failed to read file");
    assert!(content.contains("\"period\": \"Today\""));
    assert!(content.contains("\"API \\\"Service\\\"\""));

    // Cleanup
    let _ = fs::remove_dir_all(temp_dir);
}
