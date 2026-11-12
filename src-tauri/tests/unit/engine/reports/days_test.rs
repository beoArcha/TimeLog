use super::helpers::{
    build, log, project, request, resolved_range, root_task, snapshot, utc_range,
};
use oxyflow_timelog::types::{ReportDay, ReportVariant};

fn day(date: &str, seconds: u64) -> ReportDay {
    ReportDay {
        date: date.to_string(),
        seconds,
    }
}

#[test]
fn test_given_an_entry_crossing_utc_midnight_when_building_then_its_time_is_split_across_both_days()
{
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log(
            &task,
            "l1",
            "2026-06-15T23:00:00Z",
            "2026-06-16T02:00:00Z",
        )],
        vec![],
    );
    let range = utc_range("2026-06-15T00:00:00Z", "2026-06-17T00:00:00Z");

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &range);

    // Assert
    assert_eq!(
        doc.days,
        vec![day("2026-06-15", 3600), day("2026-06-16", 7200),]
    );
}

#[test]
fn test_given_an_entry_spanning_three_days_when_building_then_the_middle_day_gets_all_24_hours() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log(
            &task,
            "l1",
            "2026-06-15T22:00:00Z",
            "2026-06-17T01:00:00Z",
        )],
        vec![],
    );
    let range = utc_range("2026-06-15T00:00:00Z", "2026-06-18T00:00:00Z");

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &range);

    // Assert
    assert_eq!(doc.days[1], day("2026-06-16", 86_400));
}

#[test]
fn test_given_entries_crossing_midnight_when_building_then_the_days_add_up_to_the_total_seconds() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![
            log(&task, "l1", "2026-06-15T23:30:00Z", "2026-06-16T00:45:00Z"),
            log(&task, "l2", "2026-06-16T23:59:59Z", "2026-06-17T00:00:01Z"),
        ],
        vec![],
    );
    let range = utc_range("2026-06-15T00:00:00Z", "2026-06-18T00:00:00Z");

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &range);

    // Assert
    let summed: u64 = doc.days.iter().map(|d| d.seconds).sum();
    assert_eq!(summed, doc.totals.seconds);
}

#[test]
fn test_given_a_bounded_range_without_time_when_building_then_every_day_is_emitted_as_zero() {
    // Arrange
    let data = snapshot(vec![], vec![], vec![], vec![]);
    let range = utc_range("2026-06-15T00:00:00Z", "2026-06-18T00:00:00Z");

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &range);

    // Assert
    assert_eq!(
        doc.days,
        vec![
            day("2026-06-15", 0),
            day("2026-06-16", 0),
            day("2026-06-17", 0),
        ]
    );
}

#[test]
fn test_given_a_bounded_range_when_building_then_the_exclusive_end_day_is_not_emitted() {
    // Arrange
    let data = snapshot(vec![], vec![], vec![], vec![]);
    let range = utc_range("2026-06-15T00:00:00Z", "2026-06-16T00:00:00Z");

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &range);

    // Assert
    assert_eq!(doc.days, vec![day("2026-06-15", 0)]);
}

#[test]
fn test_given_a_range_without_an_upper_bound_when_building_then_only_days_with_time_are_emitted() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![
            log(&task, "l1", "2026-06-16T10:00:00Z", "2026-06-16T11:00:00Z"),
            log(&task, "l2", "2026-06-18T10:00:00Z", "2026-06-18T10:30:00Z"),
        ],
        vec![],
    );
    let range = resolved_range(Some("2026-06-15T00:00:00Z"), None, "UTC");

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &range);

    // Assert
    assert_eq!(
        doc.days,
        vec![day("2026-06-16", 3600), day("2026-06-18", 1800)]
    );
}

#[test]
fn test_given_a_range_without_a_lower_bound_when_building_then_only_days_with_time_are_emitted() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log(
            &task,
            "l1",
            "2026-06-10T10:00:00Z",
            "2026-06-10T11:00:00Z",
        )],
        vec![],
    );
    let range = resolved_range(None, Some("2026-06-16T00:00:00Z"), "UTC");

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &range);

    // Assert
    assert_eq!(doc.days, vec![day("2026-06-10", 3600)]);
}

#[test]
fn test_given_a_fully_unbounded_range_without_time_when_building_then_no_days_are_emitted() {
    // Arrange
    let data = snapshot(vec![], vec![], vec![], vec![]);
    let range = resolved_range(None, None, "UTC");

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &range);

    // Assert
    assert!(doc.days.is_empty());
}

#[test]
fn test_given_a_range_timezone_ahead_of_utc_when_building_then_time_lands_on_the_local_day() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log(
            &task,
            "l1",
            "2026-06-15T22:30:00Z",
            "2026-06-15T23:30:00Z",
        )],
        vec![],
    );
    let range = resolved_range(
        Some("2026-06-14T22:00:00Z"),
        Some("2026-06-16T22:00:00Z"),
        "Europe/Warsaw",
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &range);

    // Assert
    assert_eq!(
        doc.days,
        vec![day("2026-06-15", 0), day("2026-06-16", 3600)]
    );
}

#[test]
fn test_given_the_spring_forward_day_in_warsaw_when_building_then_it_holds_23_hours() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log(
            &task,
            "l1",
            "2026-03-28T23:00:00Z",
            "2026-03-29T22:00:00Z",
        )],
        vec![],
    );
    let range = resolved_range(
        Some("2026-03-28T23:00:00Z"),
        Some("2026-03-29T22:00:00Z"),
        "Europe/Warsaw",
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &range);

    // Assert
    assert_eq!(doc.days, vec![day("2026-03-29", 23 * 3600)]);
}

#[test]
fn test_given_the_fall_back_day_in_warsaw_when_building_then_it_holds_25_hours() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log(
            &task,
            "l1",
            "2026-10-24T22:00:00Z",
            "2026-10-25T23:00:00Z",
        )],
        vec![],
    );
    let range = resolved_range(
        Some("2026-10-24T22:00:00Z"),
        Some("2026-10-25T23:00:00Z"),
        "Europe/Warsaw",
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &range);

    // Assert
    assert_eq!(doc.days, vec![day("2026-10-25", 25 * 3600)]);
}

#[test]
fn test_given_entries_logged_out_of_order_when_building_then_days_are_sorted_by_date_ascending() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![
            log(
                &task,
                "l_late",
                "2026-06-17T10:00:00Z",
                "2026-06-17T11:00:00Z",
            ),
            log(
                &task,
                "l_early",
                "2026-06-15T10:00:00Z",
                "2026-06-15T11:00:00Z",
            ),
            log(
                &task,
                "l_mid",
                "2026-06-16T10:00:00Z",
                "2026-06-16T11:00:00Z",
            ),
        ],
        vec![],
    );
    let range = resolved_range(None, None, "UTC");

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &range);

    // Assert
    let dates: Vec<&str> = doc.days.iter().map(|d| d.date.as_str()).collect();
    assert_eq!(dates, vec!["2026-06-15", "2026-06-16", "2026-06-17"]);
}
