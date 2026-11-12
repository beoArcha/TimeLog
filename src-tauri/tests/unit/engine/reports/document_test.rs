use super::helpers::{
    build, june_15, log_lasting, project, request, root_task, snapshot, GENERATED_AT,
};
use oxyflow_timelog::types::{ReportVariant, REPORT_SCHEMA_NAME, REPORT_SCHEMA_VERSION};

#[test]
fn test_given_any_request_when_building_then_the_schema_identifies_the_report_contract() {
    // Arrange
    let data = snapshot(vec![], vec![], vec![], vec![]);

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    assert_eq!(doc.schema, REPORT_SCHEMA_NAME);
    assert_eq!(doc.schema_version, REPORT_SCHEMA_VERSION);
    assert_eq!(doc.variant, ReportVariant::Summary);
}

#[test]
fn test_given_an_injected_clock_when_building_then_generated_at_is_rfc3339_utc_whole_seconds() {
    // Arrange
    let data = snapshot(vec![], vec![], vec![], vec![]);

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    assert_eq!(doc.generated_at, GENERATED_AT);
}

#[test]
fn test_given_any_request_when_building_then_the_generator_is_oxy_at_the_crate_version() {
    // Arrange
    let data = snapshot(vec![], vec![], vec![], vec![]);

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    assert_eq!(doc.generator.name, "oxy");
    assert_eq!(doc.generator.version, env!("CARGO_PKG_VERSION"));
}

#[test]
fn test_given_a_resolved_range_when_building_then_the_document_echoes_it() {
    // Arrange
    let data = snapshot(vec![], vec![], vec![], vec![]);
    let range = june_15();

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &range);

    // Assert
    assert_eq!(doc.range, range);
}

#[test]
fn test_given_logged_time_when_building_then_totals_count_seconds_and_entries() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 600), log_lasting(&task, "l2", 900)],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    assert_eq!(doc.totals.seconds, 1500);
    assert_eq!(doc.totals.entry_count, 2);
}
