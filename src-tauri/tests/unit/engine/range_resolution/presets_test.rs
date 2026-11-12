use super::helpers::*;
use chrono_tz::Tz;
use oxyflow_timelog::engine::range::resolve_range_at;
use oxyflow_timelog::types::RangePreset;

#[test]
fn test_given_utc_when_resolving_today_then_returns_utc_day_bounds() {
    // Arrange
    let request = preset(RangePreset::Today);

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-11T00:00:00Z", "2026-11-12T00:00:00Z")
    );
    assert_eq!(result.timezone, "UTC");
    assert_eq!(result.preset, Some(RangePreset::Today));
}

#[test]
fn test_given_utc_when_resolving_yesterday_then_returns_previous_day() {
    // Arrange
    let request = preset(RangePreset::Yesterday);

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-10T00:00:00Z", "2026-11-11T00:00:00Z")
    );
}

#[test]
fn test_given_utc_when_resolving_week_then_starts_on_monday() {
    // Arrange
    let request = preset(RangePreset::Week);

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-09T00:00:00Z", "2026-11-16T00:00:00Z")
    );
}

#[test]
fn test_given_utc_when_resolving_last_week_then_returns_previous_monday_week() {
    // Arrange
    let request = preset(RangePreset::LastWeek);

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-02T00:00:00Z", "2026-11-09T00:00:00Z")
    );
}

#[test]
fn test_given_utc_when_resolving_month_then_returns_calendar_month() {
    // Arrange
    let request = preset(RangePreset::Month);

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-01T00:00:00Z", "2026-12-01T00:00:00Z")
    );
}

#[test]
fn test_given_january_when_resolving_last_month_then_crosses_year_boundary() {
    // Arrange
    let request = preset(RangePreset::LastMonth);

    // Act
    let result = resolve_range_at(&request, utc("2026-01-15T10:00:00Z"), Tz::UTC).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2025-12-01T00:00:00Z", "2026-01-01T00:00:00Z")
    );
}

#[test]
fn test_given_utc_when_resolving_last_month_then_returns_previous_calendar_month() {
    // Arrange
    let request = preset(RangePreset::LastMonth);

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-10-01T00:00:00Z", "2026-11-01T00:00:00Z")
    );
}

#[test]
fn test_given_utc_when_resolving_all_then_returns_unbounded_range() {
    // Arrange
    let request = preset(RangePreset::All);

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC).unwrap();

    // Assert
    assert_eq!(bounds(&result), (None, None));
    assert_eq!(result.preset, Some(RangePreset::All));
}

#[test]
fn test_given_warsaw_when_resolving_today_then_returns_local_day_in_utc() {
    // Arrange
    let request = preset(RangePreset::Today);

    // Act
    let result = resolve_range_at(&request, utc(NOW), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-10T23:00:00Z", "2026-11-11T23:00:00Z")
    );
    assert_eq!(result.timezone, "Europe/Warsaw");
}

#[test]
fn test_given_warsaw_when_resolving_yesterday_then_returns_previous_local_day() {
    // Arrange
    let request = preset(RangePreset::Yesterday);

    // Act
    let result = resolve_range_at(&request, utc(NOW), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-09T23:00:00Z", "2026-11-10T23:00:00Z")
    );
}

#[test]
fn test_given_warsaw_when_resolving_week_then_starts_on_local_monday() {
    // Arrange
    let request = preset(RangePreset::Week);

    // Act
    let result = resolve_range_at(&request, utc(NOW), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-08T23:00:00Z", "2026-11-15T23:00:00Z")
    );
}

#[test]
fn test_given_warsaw_when_resolving_last_week_then_returns_previous_local_week() {
    // Arrange
    let request = preset(RangePreset::LastWeek);

    // Act
    let result = resolve_range_at(&request, utc(NOW), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-01T23:00:00Z", "2026-11-08T23:00:00Z")
    );
}

#[test]
fn test_given_warsaw_when_resolving_month_then_returns_local_month() {
    // Arrange
    let request = preset(RangePreset::Month);

    // Act
    let result = resolve_range_at(&request, utc(NOW), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-10-31T23:00:00Z", "2026-11-30T23:00:00Z")
    );
}

#[test]
fn test_given_warsaw_when_resolving_last_month_then_uses_summer_offset_at_month_start() {
    // Arrange
    let request = preset(RangePreset::LastMonth);

    // Act
    let result = resolve_range_at(&request, utc(NOW), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-09-30T22:00:00Z", "2026-10-31T23:00:00Z")
    );
}

#[test]
fn test_given_warsaw_when_resolving_all_then_returns_unbounded_range() {
    // Arrange
    let request = preset(RangePreset::All);

    // Act
    let result = resolve_range_at(&request, utc(NOW), WARSAW).unwrap();

    // Assert
    assert_eq!(bounds(&result), (None, None));
    assert_eq!(result.timezone, "Europe/Warsaw");
}

#[test]
fn test_given_utc_evening_past_local_midnight_when_resolving_today_then_uses_next_local_date() {
    // Arrange
    let request = preset(RangePreset::Today);

    // Act
    let result = resolve_range_at(&request, utc("2026-11-11T23:30:00Z"), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-11T23:00:00Z", "2026-11-12T23:00:00Z")
    );
}

#[test]
fn test_given_new_york_local_sunday_night_when_resolving_week_then_still_uses_previous_monday() {
    // Arrange
    let request = preset(RangePreset::Week);

    // Act
    let result =
        resolve_range_at(&request, utc("2026-11-09T03:30:00Z"), Tz::America__New_York).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-02T05:00:00Z", "2026-11-09T05:00:00Z")
    );
}

#[test]
fn test_given_new_york_local_monday_midnight_when_resolving_week_then_starts_new_week() {
    // Arrange
    let request = preset(RangePreset::Week);

    // Act
    let result =
        resolve_range_at(&request, utc("2026-11-09T05:00:00Z"), Tz::America__New_York).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-09T05:00:00Z", "2026-11-16T05:00:00Z")
    );
}

#[test]
fn test_given_last_week_preset_when_serializing_then_uses_camel_case_name() {
    // Arrange
    let request = preset(RangePreset::LastWeek);

    // Act
    let json = serde_json::to_string(&request).unwrap();

    // Assert
    assert!(json.contains("\"preset\":\"lastWeek\""));
}
