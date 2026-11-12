use super::builders::*;
use oxyflow_timelog::types::*;
use serde_json::json;

#[test]
fn test_range_without_bounds_or_preset_omits_those_keys() {
    // Arrange
    let mut document = a_document(ReportVariant::Summary);
    document.range = ResolvedRange {
        from: None,
        to: None,
        timezone: "UTC".to_string(),
        preset: None,
    };

    // Act
    let value = serde_json::to_value(&document).unwrap();

    // Assert
    let range = value["range"].as_object().unwrap();
    assert!(!range.contains_key("from"));
    assert!(!range.contains_key("to"));
    assert!(!range.contains_key("preset"));
    assert_eq!(range["timezone"], json!("UTC"));
}

#[test]
fn test_non_billable_rate_status_serializes_as_camel_case() {
    // Arrange
    let status = ReportRateStatus::from(RateStatus::NonBillable);

    // Act
    let value = serde_json::to_value(status).unwrap();

    // Assert
    assert_eq!(value, json!("nonBillable"));
}

#[test]
fn test_unfiltered_document_serializes_filters_with_only_include_patches() {
    // Arrange
    let document = a_document(ReportVariant::Summary);

    // Act
    let value = serde_json::to_value(&document).unwrap();

    // Assert
    assert_eq!(value["filters"], json!({ "includePatches": true }));
}
