use oxyflow_timelog::cli::exporters::{export_csv, export_to_file};
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
fn test_given_task_with_subtasks_and_direct_time_when_export_csv_then_preserves_parent_time_and_subtasks(
) {
    // Arrange
    let tree = create_tree_with_subtasks_and_direct_time();

    // Act
    let csv = export_csv(&tree);

    // Assert
    let lines: Vec<&str> = csv.lines().collect();
    assert_eq!(
        lines[0],
        "Project,Task,Subtask,Duration_Seconds,Duration_Formatted,Percentage"
    );
    assert_eq!(
        lines[1],
        "\"Alpha Project\",\"Main Feature\",\"\",1800,\"30m 00s\",50.0"
    );
    assert_eq!(
        lines[2],
        "\"Alpha Project\",\"Main Feature\",\"Subtask A\",1200,\"20m 00s\",33.3"
    );
    assert_eq!(
        lines[3],
        "\"Alpha Project\",\"Main Feature\",\"Subtask B\",600,\"10m 00s\",16.7"
    );
}

#[test]
fn test_given_empty_report_when_export_csv_then_produces_only_header() {
    // Arrange
    let tree = create_empty_tree();

    // Act
    let csv = export_csv(&tree);

    // Assert
    let lines: Vec<&str> = csv.lines().collect();
    assert_eq!(
        lines[0],
        "Project,Task,Subtask,Duration_Seconds,Duration_Formatted,Percentage"
    );
    assert_eq!(lines.len(), 1);
}

#[test]
fn test_given_csv_format_when_export_to_file_then_writes_valid_csv_file() {
    // Arrange
    let tree = create_sample_tree();
    let temp_dir =
        std::env::temp_dir().join(format!("oxy_test_export_csv_{}", uuid::Uuid::new_v4()));
    let target_file = temp_dir.join("report.csv");
    let target_path_str = target_file.to_str().unwrap();

    // Act
    let res = export_to_file(&tree, ExportFormat::Csv, target_path_str);

    // Assert
    assert!(res.is_ok());
    assert!(target_file.exists());
    let content = fs::read_to_string(&target_file).expect("failed to read file");
    assert!(
        content.starts_with("Project,Task,Subtask,Duration_Seconds,Duration_Formatted,Percentage")
    );
    assert!(content.contains("\"API \"\"Service\"\"\""));

    // Cleanup
    let _ = fs::remove_dir_all(temp_dir);
}
