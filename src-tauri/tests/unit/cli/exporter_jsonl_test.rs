use crate::shared::exporter_fixtures::create_sample_document;
use oxyflow_timelog::cli::exporters::{export_to_bytes, write_json};
use oxyflow_timelog::cli::parser::ExportFormat;
use oxyflow_timelog::types::{ReportDocument, ReportVariant};
use serde_json::Value;

fn parse_lines(bytes: &[u8]) -> Vec<Value> {
    let text = std::str::from_utf8(bytes).expect("JSONL output is UTF-8");
    text.lines()
        .map(|line| serde_json::from_str(line).expect("every line is a JSON value"))
        .collect()
}

#[test]
fn test_given_full_document_when_exporting_jsonl_then_header_fields_equal_the_document() {
    // Arrange
    let document = create_sample_document(ReportVariant::Full);

    // Act
    let bytes = export_to_bytes(&document, ExportFormat::Jsonl).expect("jsonl export");
    let lines = parse_lines(&bytes);
    let header = &lines[0];

    // Assert
    assert_eq!(header["type"], "header");
    assert_eq!(header["schema"], document.schema);
    assert_eq!(header["schemaVersion"], document.schema_version);
    assert_eq!(header["variant"], "full");
    assert_eq!(header["generatedAt"], document.generated_at);
    assert_eq!(
        header["generator"],
        serde_json::to_value(&document.generator).unwrap()
    );
    assert_eq!(
        header["range"],
        serde_json::to_value(&document.range).unwrap()
    );
    assert_eq!(
        header["filters"],
        serde_json::to_value(&document.filters).unwrap()
    );
    assert_eq!(
        header["totals"],
        serde_json::to_value(&document.totals).unwrap()
    );
    assert!(header.get("projects").is_none());
    assert!(header.get("days").is_none());
    assert!(header.get("entries").is_none());
}

#[test]
fn test_given_full_document_when_exporting_jsonl_then_line_count_is_one_plus_entries() {
    // Arrange
    let document = create_sample_document(ReportVariant::Full);
    let entry_count = document.entries.as_ref().map_or(0, Vec::len);

    // Act
    let bytes = export_to_bytes(&document, ExportFormat::Jsonl).expect("jsonl export");
    let line_count = String::from_utf8(bytes).expect("UTF-8").lines().count();

    // Assert
    assert_eq!(line_count, 1 + entry_count);
}

#[test]
fn test_given_full_document_when_exporting_jsonl_then_entry_lines_follow_document_order() {
    // Arrange
    let document = create_sample_document(ReportVariant::Full);
    let entries = document.entries.clone().unwrap_or_default();

    // Act
    let bytes = export_to_bytes(&document, ExportFormat::Jsonl).expect("jsonl export");
    let lines = parse_lines(&bytes);

    // Assert
    for (line, entry) in lines[1..].iter().zip(entries.iter()) {
        assert_eq!(line["type"], "entry");
        let mut expected = serde_json::to_value(entry).unwrap();
        expected["type"] = Value::from("entry");
        assert_eq!(*line, expected);
    }
    assert_eq!(lines.len() - 1, entries.len());
}

#[test]
fn test_given_summary_document_when_exporting_jsonl_then_only_the_header_line_is_written() {
    // Arrange
    let document = create_sample_document(ReportVariant::Summary);

    // Act
    let bytes = export_to_bytes(&document, ExportFormat::Jsonl).expect("jsonl export");
    let lines = parse_lines(&bytes);

    // Assert
    assert_eq!(lines.len(), 1);
    assert_eq!(lines[0]["type"], "header");
    assert_eq!(lines[0]["variant"], "summary");
}

#[test]
fn test_given_full_document_with_no_entries_when_exporting_jsonl_then_only_the_header_is_written() {
    // Arrange
    let mut document = create_sample_document(ReportVariant::Full);
    document.entries = Some(Vec::new());

    // Act
    let bytes = export_to_bytes(&document, ExportFormat::Jsonl).expect("jsonl export");

    // Assert
    assert_eq!(parse_lines(&bytes).len(), 1);
}

#[test]
fn test_given_document_when_exporting_jsonl_then_every_line_is_compact_and_newline_terminated() {
    // Arrange
    let document = create_sample_document(ReportVariant::Full);

    // Act
    let bytes = export_to_bytes(&document, ExportFormat::Jsonl).expect("jsonl export");
    let text = String::from_utf8(bytes).expect("UTF-8");

    // Assert
    assert!(text.ends_with('\n'));
    assert_eq!(text.matches('\n').count(), text.lines().count());
    for line in text.lines() {
        assert!(!line.starts_with(' '), "{line}");
        assert!(!line.contains("\n  "), "{line}");
    }
}

#[test]
fn test_given_document_when_exporting_json_then_it_deserializes_back_into_an_identical_document() {
    // Arrange
    let document = create_sample_document(ReportVariant::Full);
    let mut buffer = Vec::new();
    write_json(&document, &mut buffer).expect("json export");

    // Act
    let parsed: ReportDocument = serde_json::from_slice(&buffer).expect("json must round-trip");

    // Assert
    assert_eq!(parsed, document);
}
