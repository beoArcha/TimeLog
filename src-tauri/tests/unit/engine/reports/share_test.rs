use super::helpers::{build, june_15, log_lasting, project, request, root_task, snapshot};
use oxyflow_timelog::types::{ReportDocument, ReportVariant};

const TOTAL_SECONDS: i64 = 20_000;

/// A project whose `t_target` task logs `target_seconds` out of `total_seconds` in total.
fn document_with_target(target_seconds: i64, total_seconds: i64) -> ReportDocument {
    let target = root_task("t_target", "p1");
    let rest = root_task("t_rest", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![target.clone(), rest.clone()],
        vec![
            log_lasting(&target, "l_target", target_seconds),
            log_lasting(&rest, "l_rest", total_seconds - target_seconds),
        ],
        vec![],
    );
    build(&data, &request(ReportVariant::Summary), &june_15())
}

fn target_share(doc: &ReportDocument) -> u32 {
    doc.projects[0]
        .tasks
        .iter()
        .find(|task| task.id == "t_target")
        .unwrap()
        .share_basis_points
}

#[test]
fn test_given_an_exact_half_basis_point_when_building_then_it_rounds_down_to_the_even_neighbour() {
    // Arrange
    let seconds = 1;

    // Act
    let doc = document_with_target(seconds, TOTAL_SECONDS);

    // Assert
    assert_eq!(target_share(&doc), 0);
}

#[test]
fn test_given_an_exact_one_and_a_half_basis_points_when_building_then_it_rounds_up_to_the_even_neighbour(
) {
    // Arrange
    let seconds = 3;

    // Act
    let doc = document_with_target(seconds, TOTAL_SECONDS);

    // Assert
    assert_eq!(target_share(&doc), 2);
}

#[test]
fn test_given_an_exact_two_and_a_half_basis_points_when_building_then_it_rounds_down_to_the_even_neighbour(
) {
    // Arrange
    let seconds = 5;

    // Act
    let doc = document_with_target(seconds, TOTAL_SECONDS);

    // Assert
    assert_eq!(target_share(&doc), 2);
}

#[test]
fn test_given_a_third_of_the_total_when_building_then_the_share_rounds_down_to_the_nearest_point() {
    // Arrange
    let seconds = 1;

    // Act
    let doc = document_with_target(seconds, 3);

    // Assert
    assert_eq!(target_share(&doc), 3333);
}

#[test]
fn test_given_two_thirds_of_the_total_when_building_then_the_share_rounds_up_to_the_nearest_point()
{
    // Arrange
    let seconds = 2;

    // Act
    let doc = document_with_target(seconds, 3);

    // Assert
    assert_eq!(target_share(&doc), 6667);
}

#[test]
fn test_given_a_single_task_when_building_then_project_and_task_hold_the_full_share() {
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
    assert_eq!(doc.projects[0].share_basis_points, 10_000);
    assert_eq!(doc.projects[0].tasks[0].share_basis_points, 10_000);
}
