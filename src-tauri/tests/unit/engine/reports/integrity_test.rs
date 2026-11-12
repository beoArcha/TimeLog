use super::helpers::{generated_at, june_15, log_lasting, project, request, root_task, snapshot};
use oxyflow_timelog::engine::reports::build_report_at;
use oxyflow_timelog::engine::EngineError;
use oxyflow_timelog::types::ReportVariant;

#[test]
fn test_given_a_log_for_an_unknown_task_when_building_then_it_fails_with_entity_not_found() {
    // Arrange
    let orphan = root_task("t_missing", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![],
        vec![log_lasting(&orphan, "l1", 600)],
        vec![],
    );

    // Act
    let result = build_report_at(
        &data,
        &request(ReportVariant::Summary),
        &june_15(),
        generated_at(),
    );

    // Assert
    assert_eq!(
        result.unwrap_err(),
        EngineError::EntityNotFound {
            entity: "Task",
            id: "t_missing".to_string()
        }
    );
}

#[test]
fn test_given_a_task_in_an_unknown_project_when_building_then_it_fails_with_entity_not_found() {
    // Arrange
    let task = root_task("t1", "p_missing");
    let data = snapshot(
        vec![],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 600)],
        vec![],
    );

    // Act
    let result = build_report_at(
        &data,
        &request(ReportVariant::Summary),
        &june_15(),
        generated_at(),
    );

    // Assert
    assert_eq!(
        result.unwrap_err(),
        EngineError::EntityNotFound {
            entity: "Project",
            id: "p_missing".to_string()
        }
    );
}

#[test]
fn test_given_a_cyclic_task_hierarchy_when_building_then_it_fails_instead_of_looping() {
    // Arrange
    let mut a = root_task("a", "p1");
    let mut b = root_task("b", "p1");
    a.parent_task_id = Some("b".to_string());
    b.parent_task_id = Some("a".to_string());
    let data = snapshot(
        vec![project("p1")],
        vec![a.clone(), b],
        vec![log_lasting(&a, "l1", 600)],
        vec![],
    );

    // Act
    let result = build_report_at(
        &data,
        &request(ReportVariant::Summary),
        &june_15(),
        generated_at(),
    );

    // Assert
    assert!(matches!(result, Err(EngineError::Validation(_))));
}

#[test]
fn test_given_an_unknown_timezone_in_the_range_when_building_then_it_fails_with_invalid_timezone() {
    // Arrange
    let data = snapshot(vec![], vec![], vec![], vec![]);
    let range = super::helpers::resolved_range(None, None, "Mars/Olympus");

    // Act
    let result = build_report_at(
        &data,
        &request(ReportVariant::Summary),
        &range,
        generated_at(),
    );

    // Assert
    assert_eq!(
        result.unwrap_err(),
        EngineError::InvalidTimezone("Mars/Olympus".to_string())
    );
}
