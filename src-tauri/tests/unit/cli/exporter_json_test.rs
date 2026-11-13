use crate::shared::exporter_fixtures::create_sample_document;
use crate::shared::report_document_builders::a_document;
use oxyflow_timelog::cli::exporters::export_json;
use oxyflow_timelog::types::{ReportDocument, ReportVariant};

#[test]
fn test_given_full_document_when_export_json_then_produces_the_bare_pretty_printed_document() {
    // Arrange
    let document = create_sample_document(ReportVariant::Full);

    // Act
    let json = export_json(&document).expect("json export should succeed");

    // Assert
    assert!(json.contains("\"schema\": \"oxy.report\""));
    assert!(json.contains("\"schemaVersion\": 2"));
    assert!(json.contains("\"entries\": ["));
    assert!(json.ends_with(
        "}
"
    ));
    let parsed: ReportDocument = serde_json::from_str(&json).expect("must parse back");
    assert_eq!(parsed, document);
}

#[test]
fn test_given_summary_document_when_export_json_then_omits_entries() {
    // Arrange
    let document = a_document(ReportVariant::Summary);

    // Act
    let json = export_json(&document).expect("json export should succeed");

    // Assert
    assert!(json.contains("\"variant\": \"summary\""));
    assert!(!json.contains("\"entries\""));
}
