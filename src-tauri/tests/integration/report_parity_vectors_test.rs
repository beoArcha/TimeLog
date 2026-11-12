use chrono::{DateTime, Utc};
use oxyflow_timelog::engine::reports::{build_report_at, ReportSnapshot};
use oxyflow_timelog::engine::EngineError;
use oxyflow_timelog::types::{
    PatchLog, Project, ReportDocument, ReportRequest, ResolvedRange, Task, TimeLog,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;

const FIXTURE_PATH: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../tests/fixtures/report-parity-vectors.json"
);

/// The generator version changes every release; each runtime substitutes its own for this token
/// so the shared vectors never need regenerating on a version bump.
const VERSION_TOKEN: &str = "<engine-version>";

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SnapshotInput {
    projects: Vec<Project>,
    tasks: Vec<Task>,
    logs: Vec<TimeLog>,
    patches: Vec<PatchLog>,
    default_rate_cents: Option<u64>,
}

impl SnapshotInput {
    fn into_snapshot(self) -> ReportSnapshot {
        ReportSnapshot {
            projects: self.projects,
            tasks: self.tasks,
            logs: self.logs,
            patches: self.patches,
            default_rate_cents: self.default_rate_cents,
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Vector {
    description: String,
    snapshot: SnapshotInput,
    request: ReportRequest,
    range: ResolvedRange,
    generated_at: String,
    expected: Option<Value>,
    expected_error_code: Option<String>,
}

#[derive(Deserialize)]
struct Fixture {
    vectors: Vec<Vector>,
}

/// Inputs stay as raw JSON so regeneration rewrites only the expectations; `expected` is typed so it
/// serializes in the contract's field order, which the TypeScript test compares byte for byte.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SourceVector {
    description: String,
    snapshot: Value,
    request: Value,
    range: Value,
    generated_at: String,
    expected_error_code: Option<String>,
}

#[derive(Deserialize)]
struct SourceFixture {
    vectors: Vec<SourceVector>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WrittenVector {
    description: String,
    snapshot: Value,
    request: Value,
    range: Value,
    generated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    expected: Option<ReportDocument>,
    #[serde(skip_serializing_if = "Option::is_none")]
    expected_error_code: Option<String>,
}

#[derive(Serialize)]
struct WrittenFixture {
    vectors: Vec<WrittenVector>,
}

fn load_fixture() -> Fixture {
    let raw = fs::read_to_string(FIXTURE_PATH).expect("read shared report fixture");
    serde_json::from_str(&raw).expect("parse shared report fixture")
}

fn instant(raw: &str) -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(raw)
        .expect("fixture generatedAt is RFC3339")
        .with_timezone(&Utc)
}

fn build_vector(vector: Vector) -> (String, Result<ReportDocument, EngineError>) {
    let snapshot = vector.snapshot.into_snapshot();
    let result = build_report_at(
        &snapshot,
        &vector.request,
        &vector.range,
        instant(&vector.generated_at),
    );
    (vector.description, result)
}

#[test]
fn test_given_shared_report_vectors_when_building_then_rust_matches_every_expected_document() {
    // Given
    let vectors = load_fixture().vectors;
    let expected_version = Value::String(env!("CARGO_PKG_VERSION").to_string());

    for vector in vectors.into_iter().filter(|v| v.expected.is_some()) {
        let mut expected = vector.expected.clone().expect("filtered on expected");
        assert_eq!(expected["generator"]["version"], VERSION_TOKEN);
        expected["generator"]["version"] = expected_version.clone();

        // When
        let (description, result) = build_vector(vector);
        let actual = serde_json::to_value(result.expect("vector builds")).unwrap();

        // Then
        assert_eq!(actual, expected, "report parity failure: {description}");
    }
}

#[test]
fn test_given_shared_report_error_vectors_when_building_then_rust_fails_with_the_expected_code() {
    // Given
    let vectors = load_fixture().vectors;

    for vector in vectors
        .into_iter()
        .filter(|v| v.expected_error_code.is_some())
    {
        let expected_code = vector.expected_error_code.clone();

        // When
        let (description, result) = build_vector(vector);

        // Then
        assert_eq!(
            result.err().map(|error| error.code().to_string()),
            expected_code,
            "report error parity failure: {description}"
        );
    }
}

#[test]
fn test_given_shared_report_vectors_when_inspecting_then_every_one_declares_exactly_one_outcome() {
    // Given
    let vectors = load_fixture().vectors;

    // When
    let ambiguous: Vec<_> = vectors
        .iter()
        .filter(|v| v.expected.is_some() == v.expected_error_code.is_some())
        .map(|v| v.description.as_str())
        .collect();

    // Then
    assert!(
        ambiguous.is_empty(),
        "vectors need exactly one of expected / expectedErrorCode: {ambiguous:?}"
    );
}

/// Run with `cargo test --test integration_tests regenerate_report_parity_vectors -- --ignored` after an
/// intentional change to the report contract, then review the fixture diff.
#[test]
#[ignore = "rewrites tests/fixtures/report-parity-vectors.json from the Rust engine output"]
fn regenerate_report_parity_vectors() {
    let raw = fs::read_to_string(FIXTURE_PATH).expect("read shared report fixture");
    let source: SourceFixture = serde_json::from_str(&raw).expect("parse shared report fixture");

    let vectors = source.vectors.into_iter().map(write_vector).collect();

    let json = serde_json::to_string_pretty(&WrittenFixture { vectors }).unwrap();
    fs::write(FIXTURE_PATH, format!("{json}\n")).expect("write shared report fixture");
}

fn write_vector(source: SourceVector) -> WrittenVector {
    let snapshot: SnapshotInput =
        serde_json::from_value(source.snapshot.clone()).expect("parse snapshot");
    let request: ReportRequest =
        serde_json::from_value(source.request.clone()).expect("parse request");
    let range: ResolvedRange = serde_json::from_value(source.range.clone()).expect("parse range");
    let result = build_report_at(
        &snapshot.into_snapshot(),
        &request,
        &range,
        instant(&source.generated_at),
    );

    let (expected, expected_error_code) = match (result, source.expected_error_code) {
        (Ok(mut doc), None) => {
            doc.generator.version = VERSION_TOKEN.to_string();
            (Some(doc), None)
        }
        (Err(error), Some(code)) => {
            assert_eq!(error.code(), code, "error code: {}", source.description);
            (None, Some(code))
        }
        (Ok(_), Some(code)) => panic!("{} should fail with {code}", source.description),
        (Err(error), None) => panic!("{} failed unexpectedly: {error}", source.description),
    };

    WrittenVector {
        description: source.description,
        snapshot: source.snapshot,
        request: source.request,
        range: source.range,
        generated_at: source.generated_at,
        expected,
        expected_error_code,
    }
}
