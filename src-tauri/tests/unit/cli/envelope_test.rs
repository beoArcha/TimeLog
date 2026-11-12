use chrono::{TimeZone, Utc};
use oxyflow_timelog::cli::shared::envelope::{EnvelopeSchema, JsonStyle};
use oxyflow_timelog::cli::CliOutput;
use serde_json::json;

const SCHEMA: EnvelopeSchema = EnvelopeSchema::new("oxy.sample", 3);

fn fixed_instant() -> chrono::DateTime<Utc> {
    Utc.with_ymd_and_hms(2026, 11, 12, 10, 30, 15).unwrap()
}

#[test]
fn test_given_payload_when_wrapped_then_envelope_carries_schema_version_data_and_meta() {
    // Arrange
    let data = json!({ "activeTaskIds": ["t1"], "running": true });

    // Act
    let envelope = SCHEMA.wrap_at(&data, fixed_instant()).unwrap();

    // Assert
    let value = serde_json::to_value(&envelope).unwrap();
    assert_eq!(
        value,
        json!({
            "schema": "oxy.sample",
            "schemaVersion": 3,
            "data": { "activeTaskIds": ["t1"], "running": true },
            "meta": {
                "generatedAt": "2026-11-12T10:30:15Z",
                "generator": { "name": "oxy", "version": env!("CARGO_PKG_VERSION") }
            }
        })
    );
}

#[test]
fn test_given_json_flag_and_terminal_stdout_when_style_resolved_then_pretty() {
    // Arrange
    let (json, machine, terminal) = (true, false, true);

    // Act
    let style = JsonStyle::resolve(json, machine, terminal);

    // Assert
    assert_eq!(style, JsonStyle::Pretty);
}

#[test]
fn test_given_json_flag_and_piped_stdout_when_style_resolved_then_compact() {
    // Arrange
    let (json, machine, terminal) = (true, false, false);

    // Act
    let style = JsonStyle::resolve(json, machine, terminal);

    // Assert
    assert_eq!(style, JsonStyle::Compact);
}

#[test]
fn test_given_machine_flag_and_terminal_stdout_when_style_resolved_then_compact() {
    // Arrange
    let (json, machine, terminal) = (true, true, true);

    // Act
    let style = JsonStyle::resolve(json, machine, terminal);

    // Assert
    assert_eq!(style, JsonStyle::Compact);
}

#[test]
fn test_given_envelope_output_when_rendered_compact_then_single_line_equal_to_display() {
    // Arrange
    let output = CliOutput::envelope(SCHEMA, &json!({ "count": 1 })).unwrap();

    // Act
    let compact = output.render(JsonStyle::Compact).unwrap();

    // Assert
    assert!(!compact.contains('\n'));
    assert_eq!(compact, output.to_string());
}

#[test]
fn test_given_envelope_output_when_rendered_pretty_then_multiline_with_same_content() {
    // Arrange
    let output = CliOutput::envelope(SCHEMA, &json!({ "count": 1 })).unwrap();

    // Act
    let pretty = output.render(JsonStyle::Pretty).unwrap();

    // Assert
    assert!(pretty.contains('\n'));
    let from_pretty: serde_json::Value = serde_json::from_str(&pretty).unwrap();
    let from_compact: serde_json::Value = serde_json::from_str(&output.to_string()).unwrap();
    assert_eq!(from_pretty, from_compact);
}

#[test]
fn test_given_non_envelope_output_when_rendered_pretty_then_unchanged() {
    // Arrange
    let output = CliOutput::Raw("plain".to_string());

    // Act
    let rendered = output.render(JsonStyle::Pretty).unwrap();

    // Assert
    assert_eq!(rendered, "plain");
}
