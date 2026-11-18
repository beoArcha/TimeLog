use super::helpers::*;
use chrono_tz::Tz;
use oxyflow_timelog::engine::range::resolve_range_at;
use oxyflow_timelog::types::RangePreset;

#[test]
fn test_given_utc_when_resolving_last_30_days_then_spans_30_days_ending_today() {
    // Arrange
    let request = preset(RangePreset::Last30Days);

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-10-13T00:00:00Z", "2026-11-12T00:00:00Z")
    );
    assert_eq!(result.preset, Some(RangePreset::Last30Days));
}

#[test]
fn test_given_warsaw_range_crossing_dst_end_when_resolving_last_30_days_then_keeps_local_midnights()
{
    // Arrange
    let request = preset(RangePreset::Last30Days);

    // Act
    let result = resolve_range_at(&request, utc(NOW), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-10-12T22:00:00Z", "2026-11-11T23:00:00Z")
    );
}

#[test]
fn test_given_leap_day_when_resolving_last_30_days_then_starts_on_31_january() {
    // Arrange
    let request = preset(RangePreset::Last30Days);

    // Act
    let result = resolve_range_at(&request, utc("2028-02-29T12:00:00Z"), Tz::UTC).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2028-01-31T00:00:00Z", "2028-03-01T00:00:00Z")
    );
}

#[test]
fn test_given_mid_january_when_resolving_last_30_days_then_crosses_year_boundary() {
    // Arrange
    let request = preset(RangePreset::Last30Days);

    // Act
    let result = resolve_range_at(&request, utc("2026-01-15T10:00:00Z"), Tz::UTC).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2025-12-17T00:00:00Z", "2026-01-16T00:00:00Z")
    );
}

#[test]
fn test_given_utc_when_resolving_year_then_returns_calendar_year() {
    // Arrange
    let request = preset(RangePreset::Year);

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-01-01T00:00:00Z", "2027-01-01T00:00:00Z")
    );
    assert_eq!(result.preset, Some(RangePreset::Year));
}

#[test]
fn test_given_warsaw_when_resolving_year_then_returns_local_calendar_year() {
    // Arrange
    let request = preset(RangePreset::Year);

    // Act
    let result = resolve_range_at(&request, utc(NOW), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2025-12-31T23:00:00Z", "2026-12-31T23:00:00Z")
    );
}

#[test]
fn test_given_local_new_year_in_warsaw_before_utc_new_year_when_resolving_year_then_uses_new_year()
{
    // Arrange
    let request = preset(RangePreset::Year);

    // Act
    let result = resolve_range_at(&request, utc("2026-12-31T23:30:00Z"), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-12-31T23:00:00Z", "2027-12-31T23:00:00Z")
    );
}

#[test]
fn test_given_new_presets_when_serializing_then_use_camel_case_names() {
    // Arrange
    let requests = [
        (preset(RangePreset::Last30Days), "\"preset\":\"last30Days\""),
        (preset(RangePreset::Year), "\"preset\":\"year\""),
    ];

    // Act
    let serialized: Vec<String> = requests
        .iter()
        .map(|(request, _)| serde_json::to_string(request).unwrap())
        .collect();

    // Assert
    for ((_, expected), json) in requests.iter().zip(&serialized) {
        assert!(json.contains(expected), "{json} should contain {expected}");
    }
}
