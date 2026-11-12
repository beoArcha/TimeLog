use chrono_tz::Tz;
use oxyflow_timelog::engine::range::{resolve_range_at, resolve_timezone};
use oxyflow_timelog::engine::EngineError;
use oxyflow_timelog::types::{RangeRequest, ResolvedRange};
use serde::Deserialize;

use super::helpers::utc;

#[derive(Deserialize)]
struct Fixture {
    #[serde(rename = "rangeVectors")]
    range_vectors: Vec<RangeVector>,
    #[serde(rename = "timezoneVectors")]
    timezone_vectors: Vec<TimezoneVector>,
}

#[derive(Deserialize)]
struct RangeVector {
    description: String,
    request: RangeRequest,
    now: String,
    #[serde(rename = "timeZone")]
    time_zone: String,
    expected: Option<ResolvedRange>,
    #[serde(rename = "expectedErrorCode")]
    expected_error_code: Option<String>,
}

#[derive(Deserialize)]
struct TimezoneVector {
    description: String,
    explicit: Option<String>,
    setting: Option<String>,
    expected: Option<String>,
    #[serde(rename = "expectedErrorCode")]
    expected_error_code: Option<String>,
}

fn load_fixture() -> Fixture {
    let raw = include_str!("../../../../../tests/fixtures/range-parity-vectors.json");
    serde_json::from_str(raw).expect("parse shared range fixture")
}

fn resolve_vector(vector: &RangeVector) -> Result<ResolvedRange, EngineError> {
    let tz = resolve_timezone(Some(&vector.time_zone), None)?;
    resolve_range_at(&vector.request, utc(&vector.now), tz)
}

#[test]
fn test_given_shared_range_vectors_when_resolving_then_rust_matches_every_expectation() {
    // Given
    let fixture = load_fixture();

    // When / Then
    for vector in &fixture.range_vectors {
        let result = resolve_vector(vector);
        match (&vector.expected, &vector.expected_error_code) {
            (Some(expected), None) => assert_eq!(
                result.as_ref(),
                Ok(expected),
                "range parity failure: {}",
                vector.description
            ),
            (None, Some(code)) => assert_eq!(
                result.map_err(|error| error.code().to_string()),
                Err(code.clone()),
                "range error parity failure: {}",
                vector.description
            ),
            _ => panic!(
                "vector needs exactly one of expected / expectedErrorCode: {}",
                vector.description
            ),
        }
    }
}

#[test]
fn test_given_shared_timezone_vectors_when_resolving_then_rust_matches_every_expectation() {
    // Given
    let fixture = load_fixture();

    // When / Then
    for vector in &fixture.timezone_vectors {
        let result = resolve_timezone(vector.explicit.as_deref(), vector.setting.as_deref());
        match (&vector.expected, &vector.expected_error_code) {
            (Some(name), None) => assert_eq!(
                result.map(|tz: Tz| tz.name().to_string()),
                Ok(name.clone()),
                "timezone parity failure: {}",
                vector.description
            ),
            (None, Some(code)) => assert_eq!(
                result.map_err(|error| error.code().to_string()),
                Err(code.clone()),
                "timezone error parity failure: {}",
                vector.description
            ),
            _ => panic!(
                "vector needs exactly one of expected / expectedErrorCode: {}",
                vector.description
            ),
        }
    }
}
