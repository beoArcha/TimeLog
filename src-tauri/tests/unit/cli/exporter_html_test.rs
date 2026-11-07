use super::exporter_fixtures::*;
use oxyflow_timelog::cli::exporters::export_html;

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
