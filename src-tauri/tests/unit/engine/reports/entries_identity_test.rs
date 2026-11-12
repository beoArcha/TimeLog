use super::helpers::{
    build, june_15, log_lasting, project, project_patch, request, root_task, snapshot, subtask,
};
use oxyflow_timelog::types::ReportVariant;

#[test]
fn test_given_a_task_less_patch_when_building_then_it_counts_as_project_direct_seconds() {
    // Arrange
    let owner = project("p1");
    let patch = project_patch(
        &owner,
        "pl1",
        "2026-06-15T10:00:00Z",
        "2026-06-15T10:15:00Z",
    );
    let data = snapshot(vec![owner], vec![], vec![], vec![patch]);
    let mut req = request(ReportVariant::Summary);
    req.include_patches = Some(true);

    // Act
    let doc = build(&data, &req, &june_15());

    // Assert
    assert_eq!(doc.projects[0].direct_seconds, 900);
    assert_eq!(doc.projects[0].seconds, 900);
    assert!(doc.projects[0].tasks.is_empty());
}

#[test]
fn test_given_a_task_less_patch_when_building_full_then_its_entry_has_no_task_fields() {
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
    req.include_patches = Some(true);

    // Act
    let doc = build(&data, &req, &june_15());

    // Assert
    let entry = &doc.entries.as_ref().unwrap()[0];
    assert!(entry.is_patch);
    assert_eq!(entry.task_id, None);
    assert_eq!(entry.task_name, None);
    assert_eq!(entry.root_task_id, None);
    assert_eq!(entry.parent_task_id, None);
}

#[test]
fn test_given_a_subtask_log_when_building_full_then_the_entry_names_its_hierarchy() {
    // Arrange
    let root = root_task("r", "p1");
    let child = subtask("c", &root);
    let grandchild = subtask("g", &child);
    let data = snapshot(
        vec![project("p1")],
        vec![root.clone(), child.clone(), grandchild.clone()],
        vec![log_lasting(&grandchild, "l1", 600)],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Full), &june_15());

    // Assert
    let entry = &doc.entries.as_ref().unwrap()[0];
    assert_eq!(entry.task_id.as_deref(), Some("g"));
    assert_eq!(entry.root_task_id.as_deref(), Some("r"));
    assert_eq!(entry.parent_task_id.as_deref(), Some("c"));
    assert_eq!(entry.parent_task_name.as_deref(), Some("Task c"));
}

#[test]
fn test_given_a_root_task_log_when_building_full_then_the_root_is_the_task_and_has_no_parent() {
    // Arrange
    let root = root_task("r", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![root.clone()],
        vec![log_lasting(&root, "l1", 600)],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Full), &june_15());

    // Assert
    let entry = &doc.entries.as_ref().unwrap()[0];
    assert_eq!(entry.root_task_id.as_deref(), Some("r"));
    assert_eq!(entry.parent_task_id, None);
    assert_eq!(entry.parent_task_name, None);
}
