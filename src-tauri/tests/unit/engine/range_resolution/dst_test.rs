use super::helpers::*;
use chrono_tz::Tz;
use oxyflow_timelog::engine::range::resolve_range_at;
use oxyflow_timelog::types::RangePreset;

#[test]
fn test_given_dst_end_day_when_resolving_today_then_range_spans_25_hours() {
    // Arrange
    let request = preset(RangePreset::Today);

    // Act
    let result = resolve_range_at(&request, utc("2026-10-25T12:00:00Z"), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-10-24T22:00:00Z", "2026-10-25T23:00:00Z")
    );
}

#[test]
fn test_given_dst_start_day_when_resolving_today_then_range_spans_23_hours() {
    // Arrange
    let request = preset(RangePreset::Today);

    // Act
    let result = resolve_range_at(&request, utc("2026-03-29T12:00:00Z"), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-03-28T23:00:00Z", "2026-03-29T22:00:00Z")
    );
}

#[test]
fn test_given_santiago_midnight_gap_when_resolving_today_then_starts_at_first_valid_local_instant()
{
    // Arrange
    let request = preset(RangePreset::Today);

    // Act
    let result =
        resolve_range_at(&request, utc("2026-09-06T12:00:00Z"), Tz::America__Santiago).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-09-06T04:00:00Z", "2026-09-07T03:00:00Z")
    );
}

#[test]
fn test_given_local_datetime_in_overlap_when_resolving_then_picks_earliest_instant() {
    // Arrange
    let request = custom(Some("2026-10-25T02:30:00"), None);

    // Act
    let result = resolve_range_at(&request, utc(NOW), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        (Some("2026-10-25T00:30:00Z".to_string()), None)
    );
}
