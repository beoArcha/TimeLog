use super::exporter_fixtures::*;
use oxyflow_timelog::cli::exporters::export_csv;

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
