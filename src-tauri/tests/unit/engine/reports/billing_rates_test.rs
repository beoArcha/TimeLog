use super::helpers::{
    billed_project, build, june_15, log_lasting, project, rated_subtask, rated_task, request,
    root_task, snapshot, subtask,
};
use oxyflow_timelog::engine::billing::calculate_bankers_amount;
use oxyflow_timelog::types::{ReportRateStatus, ReportVariant};

#[test]
fn test_given_a_task_without_any_rate_when_building_then_rate_currency_and_amount_are_absent() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 3600)],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let built = &doc.projects[0].tasks[0];
    assert_eq!(built.rate_minor, None);
    assert_eq!(built.currency, None);
    assert_eq!(built.amount_minor, None);
    assert_eq!(built.rate_status, ReportRateStatus::Unconfigured);
}

#[test]
fn test_given_an_unconfigured_task_when_building_then_its_time_counts_as_unconfigured_seconds() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 3600)],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    assert_eq!(doc.totals.unconfigured_seconds, 3600);
    assert_eq!(doc.totals.billable_seconds, 0);
    assert_eq!(doc.totals.non_billable_seconds, 0);
    assert!(doc.totals.billing.is_empty());
}

#[test]
fn test_given_an_unconfigured_task_when_building_full_then_the_entry_rate_fields_are_absent() {
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
    let entry = &doc.entries.unwrap()[0];
    assert_eq!(entry.rate_minor, None);
    assert_eq!(entry.currency, None);
    assert_eq!(entry.amount_minor, None);
}

#[test]
fn test_given_a_zero_rate_task_when_building_then_rate_and_amount_are_present_and_zero() {
    // Arrange
    let task = rated_task("t1", "p1", "0.00");
    let data = snapshot(
        vec![billed_project("p1", "100.00", "USD")],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 3600)],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let built = &doc.projects[0].tasks[0];
    assert_eq!(built.rate_minor, Some(0));
    assert_eq!(built.amount_minor, Some(0));
    assert_eq!(built.rate_status, ReportRateStatus::NonBillable);
}

#[test]
fn test_given_a_zero_rate_task_when_building_then_its_time_counts_as_non_billable_seconds() {
    // Arrange
    let task = rated_task("t1", "p1", "0.00");
    let data = snapshot(
        vec![billed_project("p1", "100.00", "USD")],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 3600)],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    assert_eq!(doc.totals.non_billable_seconds, 3600);
    assert_eq!(doc.totals.billable_seconds, 0);
    assert_eq!(doc.totals.billing[0].non_billable_seconds, 3600);
}

#[test]
fn test_given_a_zero_rate_task_when_building_full_then_the_entry_carries_zero_rate_and_amount() {
    // Arrange
    let task = rated_task("t1", "p1", "0.00");
    let data = snapshot(
        vec![billed_project("p1", "100.00", "USD")],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 3600)],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Full), &june_15());

    // Assert
    let entry = &doc.entries.unwrap()[0];
    assert_eq!(entry.rate_minor, Some(0));
    assert_eq!(entry.amount_minor, Some(0));
    assert_eq!(entry.currency.as_deref(), Some("USD"));
}

#[test]
fn test_given_a_subtask_with_its_own_rate_when_building_then_it_uses_that_rate_as_custom() {
    // Arrange
    let root = root_task("r", "p1");
    let child = rated_subtask("c", &root, "200.00");
    let data = snapshot(
        vec![billed_project("p1", "100.00", "USD")],
        vec![root.clone(), child.clone()],
        vec![
            log_lasting(&root, "l_r", 600),
            log_lasting(&child, "l_c", 3600),
        ],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let subtask = &doc.projects[0].tasks[0].subtasks[0];
    assert_eq!(subtask.rate_minor, Some(20_000));
    assert_eq!(subtask.rate_status, ReportRateStatus::Custom);
    assert_eq!(subtask.amount_minor, Some(20_000));
}

#[test]
fn test_given_a_subtask_without_a_rate_when_building_then_it_inherits_the_project_rate() {
    // Arrange
    let root = rated_task("r", "p1", "300.00");
    let child = subtask("c", &root);
    let data = snapshot(
        vec![billed_project("p1", "100.00", "USD")],
        vec![root.clone(), child.clone()],
        vec![
            log_lasting(&root, "l_r", 600),
            log_lasting(&child, "l_c", 3600),
        ],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let subtask = &doc.projects[0].tasks[0].subtasks[0];
    assert_eq!(subtask.rate_minor, Some(10_000));
    assert_eq!(subtask.rate_status, ReportRateStatus::Inherited);
    assert_eq!(subtask.currency.as_deref(), Some("USD"));
}

#[test]
fn test_given_only_a_default_rate_when_building_then_tasks_inherit_it() {
    // Arrange
    let task = root_task("t1", "p1");
    let mut data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 3600)],
        vec![],
    );
    data.default_rate_cents = Some(5_000);

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let built = &doc.projects[0].tasks[0];
    assert_eq!(built.rate_minor, Some(5_000));
    assert_eq!(built.rate_status, ReportRateStatus::Inherited);
}

#[test]
fn test_given_a_half_cent_that_rounds_down_when_building_then_it_matches_bankers_rounding() {
    // Arrange
    let task = rated_task("t1", "p1", "0.01");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 1800)],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    assert_eq!(doc.projects[0].tasks[0].amount_minor, Some(0));
    assert_eq!(calculate_bankers_amount(1800, 1), 0);
}

#[test]
fn test_given_a_half_cent_that_rounds_up_when_building_then_it_matches_bankers_rounding() {
    // Arrange
    let task = rated_task("t1", "p1", "0.01");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 5400)],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    assert_eq!(doc.projects[0].tasks[0].amount_minor, Some(2));
    assert_eq!(calculate_bankers_amount(5400, 1), 2);
}
