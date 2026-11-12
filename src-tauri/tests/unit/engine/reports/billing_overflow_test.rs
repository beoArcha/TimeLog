use super::helpers::{
    billed_project, build, generated_at, june_15, log_lasting, rated_task, request, snapshot,
};
use oxyflow_timelog::engine::reports::build_report_at;
use oxyflow_timelog::engine::EngineError;
use oxyflow_timelog::types::ReportVariant;

const MAX_SAFE_AMOUNT: u64 = 9_007_199_254_740_991;

#[test]
fn test_given_an_amount_beyond_the_safe_integer_when_building_then_it_fails_with_a_typed_error() {
    // Arrange
    let task = rated_task("t1", "p1", "90071992547409.91");
    let data = snapshot(
        vec![billed_project("p1", "1.00", "USD")],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 3601)],
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
        EngineError::AmountOutOfRange {
            limit: MAX_SAFE_AMOUNT
        }
    );
}

#[test]
fn test_given_task_amounts_that_only_overflow_when_summed_then_the_currency_total_fails_with_a_typed_error(
) {
    // Arrange
    let first = rated_task("t1", "p1", "50000000000000.00");
    let second = rated_task("t2", "p1", "50000000000000.00");
    let data = snapshot(
        vec![billed_project("p1", "1.00", "USD")],
        vec![first.clone(), second.clone()],
        vec![
            log_lasting(&first, "l1", 3600),
            log_lasting(&second, "l2", 3600),
        ],
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
        EngineError::AmountOutOfRange {
            limit: MAX_SAFE_AMOUNT
        }
    );
}

#[test]
fn test_given_the_largest_safe_amount_when_building_then_it_is_emitted_unchanged() {
    // Arrange
    let task = rated_task("t1", "p1", "90071992547409.91");
    let data = snapshot(
        vec![billed_project("p1", "1.00", "USD")],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 3600)],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    assert_eq!(doc.projects[0].tasks[0].amount_minor, Some(MAX_SAFE_AMOUNT));
}
