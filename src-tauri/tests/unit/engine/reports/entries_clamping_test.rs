use super::helpers::{
    build, june_15, log, log_lasting, project, request, resolved_range, root_task, running_log,
    snapshot, utc_range,
};
use oxyflow_timelog::types::ReportVariant;

#[test]
fn test_given_a_log_crossing_the_range_start_when_building_then_it_is_clamped_with_its_original_length(
) {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log(
            &task,
            "l1",
            "2026-06-15T09:30:00Z",
            "2026-06-15T10:30:00Z",
        )],
        vec![],
    );
    let range = utc_range("2026-06-15T10:00:00Z", "2026-06-15T11:00:00Z");

    // Act
    let doc = build(&data, &request(ReportVariant::Full), &range);

    // Assert
    let entry = &doc.entries.as_ref().unwrap()[0];
    assert_eq!(entry.seconds, 1800);
    assert_eq!(entry.original_seconds, 3600);
    assert!(entry.clamped);
    assert_eq!(doc.totals.seconds, 1800);
}

#[test]
fn test_given_a_clamped_log_when_building_then_the_stored_start_and_end_are_kept() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log(
            &task,
            "l1",
            "2026-06-15T09:30:00Z",
            "2026-06-15T10:30:00Z",
        )],
        vec![],
    );
    let range = utc_range("2026-06-15T10:00:00Z", "2026-06-15T11:00:00Z");

    // Act
    let doc = build(&data, &request(ReportVariant::Full), &range);

    // Assert
    let entry = &doc.entries.as_ref().unwrap()[0];
    assert_eq!(entry.start, "2026-06-15T09:30:00Z");
    assert_eq!(entry.end.as_deref(), Some("2026-06-15T10:30:00Z"));
}

#[test]
fn test_given_a_log_fully_inside_the_range_when_building_then_it_is_not_clamped() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 3600)],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Full), &june_15());

    // Assert
    let entry = &doc.entries.as_ref().unwrap()[0];
    assert!(!entry.clamped);
    assert_eq!(entry.seconds, entry.original_seconds);
}

#[test]
fn test_given_a_running_log_when_building_then_it_is_measured_up_to_generation_time() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![running_log(&task, "l1", "2026-06-20T11:00:00Z")],
        vec![],
    );
    let range = resolved_range(Some("2026-06-20T00:00:00Z"), None, "UTC");

    // Act
    let doc = build(&data, &request(ReportVariant::Full), &range);

    // Assert
    let entry = &doc.entries.as_ref().unwrap()[0];
    assert_eq!(entry.seconds, 3600);
    assert_eq!(entry.end, None);
    assert_eq!(doc.totals.seconds, 3600);
}

#[test]
fn test_given_a_non_utc_timezone_when_building_then_the_entry_date_is_local() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log(
            &task,
            "l1",
            "2026-06-14T22:30:00Z",
            "2026-06-14T23:30:00Z",
        )],
        vec![],
    );
    let range = resolved_range(None, None, "Europe/Warsaw");

    // Act
    let doc = build(&data, &request(ReportVariant::Full), &range);

    // Assert
    let entry = &doc.entries.as_ref().unwrap()[0];
    assert_eq!(entry.date, "2026-06-15");
    assert_eq!(entry.start, "2026-06-14T22:30:00Z");
}

#[test]
fn test_given_a_clamped_log_when_building_then_the_date_is_that_of_the_in_range_start() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log(
            &task,
            "l1",
            "2026-06-14T23:30:00Z",
            "2026-06-15T00:30:00Z",
        )],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Full), &june_15());

    // Assert
    assert_eq!(doc.entries.as_ref().unwrap()[0].date, "2026-06-15");
}

#[test]
fn test_given_a_stored_offset_timestamp_when_building_then_start_is_normalized_to_utc() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log(
            &task,
            "l1",
            "2026-06-15T12:00:00+02:00",
            "2026-06-15T13:00:00+02:00",
        )],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Full), &june_15());

    // Assert
    let entry = &doc.entries.as_ref().unwrap()[0];
    assert_eq!(entry.start, "2026-06-15T10:00:00Z");
    assert_eq!(entry.end.as_deref(), Some("2026-06-15T11:00:00Z"));
}
