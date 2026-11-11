use super::helpers::*;
use chrono_tz::Tz;
use oxyflow_timelog::engine::range::resolve_range_at;
use oxyflow_timelog::types::RangePreset;

#[test]
fn test_given_date_only_bounds_when_resolving_then_to_day_is_fully_included() {
    // Arrange
    let request = custom(Some("2026-11-10"), Some("2026-11-10"));

    // Act
    let result = resolve_range_at(&request, utc(NOW), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-09T23:00:00Z", "2026-11-10T23:00:00Z")
    );
    assert_eq!(result.preset, None);
}

#[test]
fn test_given_datetime_without_offset_when_resolving_then_interprets_as_local_time() {
    // Arrange
    let request = custom(Some("2026-11-10T08:00:00"), Some("2026-11-10 17:30:00"));

    // Act
    let result = resolve_range_at(&request, utc(NOW), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-10T07:00:00Z", "2026-11-10T16:30:00Z")
    );
}

#[test]
fn test_given_rfc3339_with_offset_when_resolving_then_uses_instant_as_is() {
    // Arrange
    let request = custom(
        Some("2026-11-10T08:00:00+02:00"),
        Some("2026-11-10T12:00:00Z"),
    );

    // Act
    let result = resolve_range_at(&request, utc(NOW), WARSAW).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        span("2026-11-10T06:00:00Z", "2026-11-10T12:00:00Z")
    );
}

#[test]
fn test_given_only_from_when_resolving_then_upper_bound_is_open() {
    // Arrange
    let request = custom(Some("2026-11-10"), None);

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        (Some("2026-11-10T00:00:00Z".to_string()), None)
    );
}

#[test]
fn test_given_only_to_when_resolving_then_lower_bound_is_open() {
    // Arrange
    let request = custom(None, Some("2026-11-10T09:00:00"));

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC).unwrap();

    // Assert
    assert_eq!(
        bounds(&result),
        (None, Some("2026-11-10T09:00:00Z".to_string()))
    );
}

#[test]
fn test_given_preset_and_from_when_resolving_then_returns_invalid_range_input() {
    // Arrange
    let mut request = preset(RangePreset::Today);
    request.from = Some("2026-11-01".to_string());

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC);

    // Assert
    assert!(is_invalid_range_input(result));
}

#[test]
fn test_given_preset_and_to_when_resolving_then_returns_invalid_range_input() {
    // Arrange
    let mut request = preset(RangePreset::All);
    request.to = Some("2026-11-01".to_string());

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC);

    // Assert
    assert!(is_invalid_range_input(result));
}

#[test]
fn test_given_from_equal_to_when_resolving_then_returns_invalid_range_input() {
    // Arrange
    let request = custom(Some("2026-11-10T10:00:00"), Some("2026-11-10T10:00:00"));

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC);

    // Assert
    assert!(is_invalid_range_input(result));
}

#[test]
fn test_given_from_day_after_to_day_when_resolving_then_returns_invalid_range_input() {
    // Arrange
    let request = custom(Some("2026-11-12"), Some("2026-11-10"));

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC);

    // Assert
    assert!(is_invalid_range_input(result));
}

#[test]
fn test_given_garbage_from_when_resolving_then_returns_invalid_range_input() {
    // Arrange
    let request = custom(Some("not-a-date"), None);

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC);

    // Assert
    assert!(is_invalid_range_input(result));
}

#[test]
fn test_given_garbage_to_when_resolving_then_returns_invalid_range_input() {
    // Arrange
    let request = custom(None, Some("2026-13-45"));

    // Act
    let result = resolve_range_at(&request, utc(NOW), Tz::UTC);

    // Assert
    assert!(is_invalid_range_input(result));
}
