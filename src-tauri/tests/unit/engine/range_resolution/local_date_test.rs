use super::helpers::*;
use chrono_tz::Tz;
use oxyflow_timelog::engine::range::{local_date_of_range, resolve_range_at};
use oxyflow_timelog::engine::EngineError;
use oxyflow_timelog::types::{RangePreset, ResolvedRange};

#[test]
fn test_given_warsaw_today_when_reading_local_date_then_returns_warsaw_calendar_day() {
    // Arrange
    let range = resolve_range_at(&preset(RangePreset::Today), utc(NOW), WARSAW).unwrap();

    // Act
    let date = local_date_of_range(&range).unwrap();

    // Assert
    assert_eq!(date, "2026-11-11");
}

#[test]
fn test_given_late_evening_utc_when_reading_warsaw_local_date_then_returns_next_day() {
    // Arrange
    let now = utc("2026-11-11T23:30:00Z");
    let range = resolve_range_at(&preset(RangePreset::Today), now, WARSAW).unwrap();

    // Act
    let date = local_date_of_range(&range).unwrap();

    // Assert
    assert_eq!(date, "2026-11-12");
}

#[test]
fn test_given_range_without_from_when_reading_local_date_then_fails_with_invalid_range_input() {
    // Arrange
    let range = ResolvedRange {
        from: None,
        to: None,
        timezone: Tz::UTC.name().to_string(),
        preset: Some(RangePreset::All),
    };

    // Act
    let result = local_date_of_range(&range);

    // Assert
    assert!(matches!(result, Err(EngineError::InvalidRangeInput(_))));
}
