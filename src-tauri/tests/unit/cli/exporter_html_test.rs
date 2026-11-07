use oxyflow_timelog::cli::exporters::{export_html, export_to_file};
use oxyflow_timelog::cli::formatters::{
    ReportProjectDto, ReportSubtaskDto, ReportTaskDto, ReportTreeDto,
};
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

fn create_tree_with_subtasks_and_direct_time() -> ReportTreeDto {
    ReportTreeDto {
        period: "This Week".to_string(),
        total_seconds: 3600,
        total_formatted: "01h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "p1".to_string(),
            name: "Alpha Project".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t1".to_string(),
                name: "Main Feature".to_string(),
                duration_seconds: 3600,
                duration_formatted: "01h 00m".to_string(),
                percentage: 100.0,
                subtasks: vec![
                    ReportSubtaskDto {
                        id: "s1".to_string(),
                        name: "Subtask A".to_string(),
                        duration_seconds: 1200,
                        duration_formatted: "20m 00s".to_string(),
                        percentage: 33.3,
                    },
                    ReportSubtaskDto {
                        id: "s2".to_string(),
                        name: "Subtask B".to_string(),
                        duration_seconds: 600,
                        duration_formatted: "10m 00s".to_string(),
                        percentage: 16.7,
                    },
                ],
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
fn test_given_task_with_subtasks_and_direct_time_when_export_html_then_preserves_parent_time_and_subtasks(
) {
    // Arrange
    let tree = create_tree_with_subtasks_and_direct_time();

    // Act
    let html = export_html(&tree);

    // Assert
    assert!(html.contains("Alpha Project"));
    assert!(html.contains("Main Feature"));
    assert!(html.contains("30m 00s"));
    assert!(html.contains("50.0%"));
    assert!(html.contains("Subtask A"));
    assert!(html.contains("20m 00s"));
    assert!(html.contains("33.3%"));
    assert!(html.contains("Subtask B"));
    assert!(html.contains("10m 00s"));
    assert!(html.contains("16.7%"));
}

#[test]
fn test_given_empty_report_when_export_html_then_renders_valid_html_structure() {
    // Arrange
    let tree = create_empty_tree();

    // Act
    let html = export_html(&tree);

    // Assert
    assert!(html.contains("<!DOCTYPE html>"));
    assert!(html.contains("oXyFlow Work Report"));
    assert!(html.contains("00m 00s"));
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
