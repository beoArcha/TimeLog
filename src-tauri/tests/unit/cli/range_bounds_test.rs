use oxyflow_timelog::cli::shared::range_bounds::{parse_log_timestamp, RangeBounds};
use oxyflow_timelog::types::ResolvedRange;

fn resolved(from: Option<&str>, to: Option<&str>) -> ResolvedRange {
    ResolvedRange {
        from: from.map(str::to_string),
        to: to.map(str::to_string),
        timezone: "UTC".to_string(),
        preset: None,
    }
}

fn october_fourteenth_window() -> RangeBounds {
    RangeBounds::from_resolved(&resolved(
        Some("2026-10-14T00:00:00Z"),
        Some("2026-10-15T00:00:00Z"),
    ))
    .unwrap()
}

#[test]
fn test_given_log_at_to_bound_when_checking_contains_then_excludes_it() {
    // Arrange
    let bounds = october_fourteenth_window();

    // Act
    let contained = bounds.contains("2026-10-15T00:00:00Z");

    // Assert
    assert!(!contained);
}

#[test]
fn test_given_log_at_from_bound_when_checking_contains_then_includes_it() {
    // Arrange
    let bounds = october_fourteenth_window();

    // Act
    let contained = bounds.contains("2026-10-14T00:00:00Z");

    // Assert
    assert!(contained);
}

#[test]
fn test_given_unbounded_range_when_checking_unparseable_log_then_keeps_it() {
    // Arrange
    let bounds = RangeBounds::from_resolved(&resolved(None, None)).unwrap();

    // Act
    let contained = bounds.contains("not-a-timestamp");

    // Assert
    assert!(contained);
}

#[test]
fn test_given_bounded_range_when_checking_unparseable_log_then_excludes_it() {
    // Arrange
    let bounds = RangeBounds::from_resolved(&resolved(Some("2026-10-14T00:00:00Z"), None)).unwrap();

    // Act
    let contained = bounds.contains("not-a-timestamp");

    // Assert
    assert!(!contained);
}

#[test]
fn test_given_offset_log_timestamp_when_checking_contains_then_compares_in_utc() {
    // Arrange
    let bounds = october_fourteenth_window();

    // Act
    let contained = bounds.contains("2026-10-15T00:30:00+02:00");

    // Assert
    assert!(contained);
}

#[test]
fn test_given_non_rfc3339_resolved_bound_when_building_bounds_then_fails() {
    // Arrange
    let range = resolved(Some("garbage"), None);

    // Act
    let result = RangeBounds::from_resolved(&range);

    // Assert
    assert!(result.is_err());
}

#[test]
fn test_given_naive_timestamp_when_parsing_log_timestamp_then_reads_as_utc() {
    // Arrange
    let raw = "2026-10-15T10:00:00";

    // Act
    let parsed = parse_log_timestamp(raw).unwrap();

    // Assert
    assert_eq!(parsed.to_rfc3339(), "2026-10-15T10:00:00+00:00");
}
