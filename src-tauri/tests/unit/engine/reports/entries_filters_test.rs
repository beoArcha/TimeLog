use super::helpers::{
    build, june_15, log_lasting, project, project_patch, request, root_task, snapshot, task_patch,
};
use oxyflow_timelog::types::ReportVariant;

#[test]
fn test_given_include_patches_false_when_building_then_patch_time_is_excluded() {
    // Arrange
    let owner = project("p1");
    let patch = project_patch(
        &owner,
        "pl1",
        "2026-06-15T10:00:00Z",
        "2026-06-15T10:15:00Z",
    );
    let data = snapshot(vec![owner], vec![], vec![], vec![patch]);
    let mut req = request(ReportVariant::Full);
    req.include_patches = Some(false);

    // Act
    let doc = build(&data, &req, &june_15());

    // Assert
    assert_eq!(doc.totals.seconds, 0);
    assert_eq!(doc.totals.entry_count, 0);
    assert!(doc.projects.is_empty());
    assert!(!doc.filters.include_patches);
}

#[test]
fn test_given_no_include_patches_preference_when_building_then_patches_default_to_excluded() {
    // Arrange
    let owner = project("p1");
    let patch = project_patch(
        &owner,
        "pl1",
        "2026-06-15T10:00:00Z",
        "2026-06-15T10:15:00Z",
    );
    let data = snapshot(vec![owner], vec![], vec![], vec![patch]);

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    assert_eq!(doc.totals.seconds, 0);
    assert!(!doc.filters.include_patches);
}

#[test]
fn test_given_include_patches_true_when_building_then_task_patch_time_counts_toward_its_task() {
    // Arrange
    let task = root_task("t1", "p1");
    let patch = task_patch(&task, "pl1", "2026-06-15T10:00:00Z", "2026-06-15T10:30:00Z");
    let data = snapshot(vec![project("p1")], vec![task], vec![], vec![patch]);
    let mut req = request(ReportVariant::Summary);
    req.include_patches = Some(true);

    // Act
    let doc = build(&data, &req, &june_15());

    // Assert
    assert_eq!(doc.projects[0].tasks[0].direct_seconds, 1800);
    assert_eq!(doc.totals.entry_count, 1);
    assert!(doc.filters.include_patches);
}

#[test]
fn test_given_a_task_filter_when_building_with_patches_then_task_less_patches_are_excluded() {
    // Arrange
    let owner = project("p1");
    let task = root_task("t1", "p1");
    let patch = project_patch(
        &owner,
        "pl1",
        "2026-06-15T10:00:00Z",
        "2026-06-15T10:15:00Z",
    );
    let data = snapshot(
        vec![owner],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 600)],
        vec![patch],
    );
    let mut req = request(ReportVariant::Summary);
    req.include_patches = Some(true);
    req.task_id = Some("t1".to_string());

    // Act
    let doc = build(&data, &req, &june_15());

    // Assert
    assert_eq!(doc.totals.seconds, 600);
    assert_eq!(doc.projects[0].direct_seconds, 0);
}

#[test]
fn test_given_the_summary_variant_when_building_then_entries_are_omitted() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 600)],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    assert!(doc.entries.is_none());
    assert_eq!(doc.totals.entry_count, 1);
}

#[test]
fn test_given_the_full_variant_and_no_data_when_building_then_entries_is_an_empty_array() {
    // Arrange
    let data = snapshot(vec![], vec![], vec![], vec![]);

    // Act
    let doc = build(&data, &request(ReportVariant::Full), &june_15());

    // Assert
    assert_eq!(doc.entries, Some(vec![]));
}
