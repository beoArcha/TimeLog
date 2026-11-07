use super::exporter_fixtures::*;
use oxyflow_timelog::cli::exporters::export_json;
use oxyflow_timelog::cli::formatters::ReportTreeDto;

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
