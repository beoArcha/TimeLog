use super::builders::*;
use oxyflow_timelog::types::*;
use serde_json::{Map, Value};

fn serialized_entry(entry: ReportEntry) -> Map<String, Value> {
    let mut document = a_document(ReportVariant::Full);
    document.entries = Some(vec![entry]);
    let value = serde_json::to_value(&document).unwrap();
    value["entries"][0].as_object().unwrap().clone()
}

#[test]
fn test_full_document_includes_every_entry_field() {
    // Arrange
    let entry = an_entry();

    // Act
    let keys = serialized_entry(entry);

    // Assert
    let expected = [
        "id",
        "projectId",
        "projectName",
        "taskId",
        "taskName",
        "rootTaskId",
        "parentTaskId",
        "parentTaskName",
        "start",
        "end",
        "date",
        "seconds",
        "originalSeconds",
        "clamped",
        "isPatch",
        "note",
        "rateMinor",
        "currency",
        "amountMinor",
    ];
    assert_eq!(keys.len(), expected.len());
    for key in expected {
        assert!(keys.contains_key(key), "missing entry key {key}");
    }
}

#[test]
fn test_none_optionals_are_omitted_from_serialized_entry() {
    // Arrange
    let entry = ReportEntry {
        end: None,
        note: None,
        rate_minor: None,
        currency: None,
        amount_minor: None,
        ..an_entry()
    };

    // Act
    let keys = serialized_entry(entry);

    // Assert
    for key in ["end", "note", "rateMinor", "currency", "amountMinor"] {
        assert!(!keys.contains_key(key), "unexpected entry key {key}");
    }
}

#[test]
fn test_task_less_patch_entry_omits_task_and_root_keys() {
    // Arrange
    let entry = a_project_patch_entry();

    // Act
    let keys = serialized_entry(entry);

    // Assert
    for key in ["taskId", "taskName", "rootTaskId"] {
        assert!(!keys.contains_key(key), "unexpected entry key {key}");
    }
    assert!(keys.contains_key("projectId"));
}
