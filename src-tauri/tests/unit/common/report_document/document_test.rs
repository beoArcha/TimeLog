use super::builders::*;
use oxyflow_timelog::types::*;
use serde_json::{json, Value};

#[test]
fn test_summary_document_uses_camel_case_keys_and_omits_entries() {
    // Arrange
    let document = a_document(ReportVariant::Summary);

    // Act
    let value = serde_json::to_value(&document).unwrap();

    // Assert
    assert_eq!(value["schema"], json!("oxy.report"));
    assert_eq!(value["schemaVersion"], json!(2));
    assert!(value.get("generatedAt").is_some());
    assert_eq!(value["totals"]["entryCount"], json!(1));
    assert_eq!(value["totals"]["billableSeconds"], json!(3600));
    assert_eq!(value["totals"]["billing"][0]["amountMinor"], json!(15_000));
    assert_eq!(value["projects"][0]["directSeconds"], json!(0));
    assert_eq!(value["projects"][0]["tasks"][0]["directSeconds"], json!(0));
    assert_eq!(
        value["projects"][0]["tasks"][0]["subtasks"][0]["parentTaskId"],
        json!("t1")
    );
    assert_eq!(value["filters"]["includePatches"], json!(true));
    assert!(value.get("entries").is_none());
}

#[test]
fn test_full_document_without_entries_serializes_empty_array() {
    // Arrange
    let mut document = a_document(ReportVariant::Full);
    document.entries = Some(vec![]);

    // Act
    let value = serde_json::to_value(&document).unwrap();

    // Assert
    assert_eq!(value["entries"], json!([]));
}

#[test]
fn test_share_basis_points_serializes_as_integer() {
    // Arrange
    let document = a_document(ReportVariant::Summary);

    // Act
    let value = serde_json::to_value(&document).unwrap();

    // Assert
    assert!(value["projects"][0]["shareBasisPoints"].is_u64());
    assert!(value["projects"][0]["tasks"][0]["shareBasisPoints"].is_u64());
}

#[test]
fn test_variant_serializes_as_lowercase_string() {
    // Arrange
    let summary = a_document(ReportVariant::Summary);
    let full = a_document(ReportVariant::Full);

    // Act
    let summary_value: Value = serde_json::to_value(&summary).unwrap();
    let full_value: Value = serde_json::to_value(&full).unwrap();

    // Assert
    assert_eq!(summary_value["variant"], json!("summary"));
    assert_eq!(full_value["variant"], json!("full"));
}

#[test]
fn test_round_trip_preserves_summary_document() {
    // Arrange
    let document = a_document(ReportVariant::Summary);

    // Act
    let json = serde_json::to_string(&document).unwrap();
    let restored: ReportDocument = serde_json::from_str(&json).unwrap();

    // Assert
    assert_eq!(restored, document);
}

#[test]
fn test_round_trip_preserves_full_document() {
    // Arrange
    let document = a_document(ReportVariant::Full);

    // Act
    let json = serde_json::to_string(&document).unwrap();
    let restored: ReportDocument = serde_json::from_str(&json).unwrap();

    // Assert
    assert_eq!(restored, document);
}
