use jsonschema::Validator;
use oxyflow_timelog::cli::exporters::{envelope_json_schema, report_json_schema};
use oxyflow_timelog::types::{
    ENVELOPE_SCHEMA_NAME, ENVELOPE_SCHEMA_VERSION, REPORT_SCHEMA_NAME, REPORT_SCHEMA_VERSION,
};
use serde_json::{json, Value};
use std::fs;

const VECTORS_PATH: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../tests/fixtures/report-parity-vectors.json"
);
const REPORT_SCHEMA_PATH: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../schemas/json/report/v2/report.schema.json"
);
const ENVELOPE_SCHEMA_PATH: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../schemas/json/envelope/v1/envelope.schema.json"
);

/// Each runtime substitutes its own generator version for this token in the shared vectors.
const VERSION_TOKEN: &str = "<engine-version>";

fn report_validator() -> Validator {
    let schema: Value = serde_json::from_str(&report_json_schema().expect("report schema"))
        .expect("generated schema is JSON");
    jsonschema::draft202012::new(&schema).expect("generated schema compiles as draft 2020-12")
}

fn expected_documents() -> Vec<Value> {
    let raw = fs::read_to_string(VECTORS_PATH).expect("read shared report vectors");
    let fixture: Value = serde_json::from_str(&raw).expect("parse shared report vectors");
    fixture["vectors"]
        .as_array()
        .expect("vectors array")
        .iter()
        .filter_map(|vector| vector.get("expected").cloned())
        .map(|mut document| {
            assert_eq!(document["generator"]["version"], VERSION_TOKEN);
            document["generator"]["version"] = json!(env!("CARGO_PKG_VERSION"));
            document
        })
        .collect()
}

fn document_with_entries() -> Value {
    expected_documents()
        .into_iter()
        .find(|document| {
            document["entries"]
                .as_array()
                .is_some_and(|e| !e.is_empty())
        })
        .expect("at least one vector produces a document with entries")
}

fn is_rejected_after(mutate: impl FnOnce(&mut Value)) -> bool {
    let mut document = document_with_entries();
    mutate(&mut document);
    !report_validator().is_valid(&document)
}

fn read_golden(path: &str) -> String {
    fs::read_to_string(path)
        .expect("read committed schema")
        .replace("\r\n", "\n")
}

#[test]
fn test_given_generated_report_schema_when_validating_every_expected_vector_then_all_documents_conform(
) {
    // Given
    let validator = report_validator();
    let documents = expected_documents();
    assert!(!documents.is_empty(), "shared vectors must hold documents");

    for document in documents {
        // When
        let errors: Vec<String> = validator
            .iter_errors(&document)
            .map(|error| error.to_string())
            .collect();

        // Then
        assert!(errors.is_empty(), "document must conform: {errors:?}");
    }
}

#[test]
fn test_given_generated_report_schema_when_reading_identity_then_it_names_oxy_report_v2() {
    // Given
    let schema: Value = serde_json::from_str(&report_json_schema().unwrap()).unwrap();

    // When
    let id = schema["$id"].as_str().unwrap_or_default();
    let title = schema["title"].as_str().unwrap_or_default();

    // Then
    assert_eq!(
        schema["$schema"],
        "https://json-schema.org/draft/2020-12/schema"
    );
    assert_eq!(title, REPORT_SCHEMA_NAME);
    assert_eq!(
        id,
        format!("urn:oxyflow:schema:{REPORT_SCHEMA_NAME}:{REPORT_SCHEMA_VERSION}")
    );
    assert_eq!(schema["properties"]["schema"]["const"], REPORT_SCHEMA_NAME);
    assert_eq!(
        schema["properties"]["schemaVersion"]["const"],
        REPORT_SCHEMA_VERSION
    );
}

#[test]
fn test_given_generated_envelope_schema_when_reading_identity_then_it_names_oxy_envelope_v1() {
    // Given
    let schema: Value = serde_json::from_str(&envelope_json_schema().unwrap()).unwrap();

    // When
    let id = schema["$id"].as_str().unwrap_or_default();

    // Then
    assert_eq!(schema["title"], ENVELOPE_SCHEMA_NAME);
    assert_eq!(
        id,
        format!("urn:oxyflow:schema:{ENVELOPE_SCHEMA_NAME}:{ENVELOPE_SCHEMA_VERSION}")
    );
    assert!(jsonschema::draft202012::new(&schema).is_ok());
}

#[test]
fn test_given_a_numeric_field_holding_a_string_when_validating_then_the_document_is_rejected() {
    // When
    let rejected = is_rejected_after(|document| document["totals"]["seconds"] = json!("3600"));

    // Then
    assert!(rejected);
}

#[test]
fn test_given_a_negative_unsigned_field_when_validating_then_the_document_is_rejected() {
    // When
    let rejected = is_rejected_after(|document| document["totals"]["entryCount"] = json!(-1));

    // Then
    assert!(rejected);
}

#[test]
fn test_given_a_missing_required_field_when_validating_then_the_document_is_rejected() {
    // When
    let rejected = is_rejected_after(|document| {
        document.as_object_mut().unwrap().remove("totals");
    });

    // Then
    assert!(rejected);
}

#[test]
fn test_given_another_schema_version_when_validating_then_the_document_is_rejected() {
    // When
    let rejected = is_rejected_after(|document| document["schemaVersion"] = json!(3));

    // Then
    assert!(rejected);
}

#[test]
fn test_given_a_null_optional_field_when_validating_then_the_document_is_rejected() {
    // When
    let rejected = is_rejected_after(|document| document["entries"][0]["note"] = Value::Null);

    // Then
    assert!(rejected);
}

#[test]
fn test_given_an_unknown_enum_value_when_validating_then_the_document_is_rejected() {
    // When
    let rejected = is_rejected_after(|document| document["variant"] = json!("detailed"));

    // Then
    assert!(rejected);
}

#[test]
fn test_given_the_committed_report_schema_when_comparing_with_generated_output_then_they_are_identical(
) {
    // When
    let generated = report_json_schema().unwrap();

    // Then
    assert_eq!(
        format!("{generated}\n"),
        read_golden(REPORT_SCHEMA_PATH),
        "run `cargo test --test integration_tests regenerate_json_schemas -- --ignored` and review the diff"
    );
}

#[test]
fn test_given_the_committed_envelope_schema_when_comparing_with_generated_output_then_they_are_identical(
) {
    // When
    let generated = envelope_json_schema().unwrap();

    // Then
    assert_eq!(
        format!("{generated}\n"),
        read_golden(ENVELOPE_SCHEMA_PATH),
        "run `cargo test --test integration_tests regenerate_json_schemas -- --ignored` and review the diff"
    );
}

#[test]
fn test_given_the_generator_when_run_twice_then_the_output_is_byte_identical() {
    // When
    let first = report_json_schema().unwrap();
    let second = report_json_schema().unwrap();

    // Then
    assert_eq!(first, second);
}

/// Run after an intentional change to the report or envelope contract, then review the diff.
#[test]
#[ignore = "rewrites the committed schemas under schemas/json from the Rust types"]
fn regenerate_json_schemas() {
    fs::write(
        REPORT_SCHEMA_PATH,
        format!("{}\n", report_json_schema().unwrap()),
    )
    .expect("write report schema");
    fs::write(
        ENVELOPE_SCHEMA_PATH,
        format!("{}\n", envelope_json_schema().unwrap()),
    )
    .expect("write envelope schema");
}
