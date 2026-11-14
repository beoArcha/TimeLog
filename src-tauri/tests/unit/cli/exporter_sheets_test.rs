use crate::shared::report_document_builders::{a_document, a_project_patch_entry, an_entry};
use oxyflow_timelog::cli::exporters::sheets::{build_workbook_model, CellValue, RowKind};
use oxyflow_timelog::types::*;

fn billing(currency: &str, amount_minor: u64) -> ReportBillingTotal {
    ReportBillingTotal {
        currency: currency.to_string(),
        amount_minor,
        billable_seconds: 0,
        non_billable_seconds: 0,
        unconfigured_seconds: 0,
    }
}

fn a_priced_task(id: &str, name: &str, seconds: u64, currency: &str, amount: u64) -> ReportTask {
    ReportTask {
        id: id.to_string(),
        name: name.to_string(),
        direct_seconds: seconds,
        seconds,
        share_basis_points: 0,
        rate_minor: Some(15_000),
        currency: Some(currency.to_string()),
        rate_status: ReportRateStatus::Custom,
        amount_minor: Some(amount),
        subtasks: vec![],
    }
}

fn a_project_named(name: &str, seconds: u64, share: u32, tasks: Vec<ReportTask>) -> ReportProject {
    ReportProject {
        id: format!("id-{name}"),
        name: name.to_string(),
        direct_seconds: 0,
        seconds,
        share_basis_points: share,
        billing: vec![],
        tasks,
    }
}

/// Alpha (PLN): "Design" has a PLN subtask, "Review" is unpriced. Beta (EUR): "Ops".
pub fn a_two_currency_document(variant: ReportVariant) -> ReportDocument {
    let mut design = a_priced_task("t1", "Design", 3600, "PLN", 7500);
    design.direct_seconds = 1800;
    design.subtasks = vec![ReportSubtask {
        seconds: 1800,
        direct_seconds: 1800,
        amount_minor: Some(7500),
        ..crate::shared::report_document_builders::a_subtask()
    }];
    let mut review = a_priced_task("t2", "Review", 1800, "PLN", 0);
    review.currency = None;
    review.amount_minor = None;
    review.rate_status = ReportRateStatus::Unconfigured;
    let mut alpha = a_project_named("Alpha", 5400, 6000, vec![design, review]);
    alpha.billing = vec![billing("PLN", 15_000)];
    let mut beta = a_project_named(
        "Beta",
        3600,
        4000,
        vec![a_priced_task("t3", "Ops", 3600, "EUR", 4000)],
    );
    beta.billing = vec![billing("EUR", 4000)];

    let mut document = a_document(variant);
    document.totals.seconds = 9000;
    document.totals.billing = vec![billing("EUR", 4000), billing("PLN", 15_000)];
    document.projects = vec![alpha, beta];
    document.days = vec![
        ReportDay {
            date: "2026-01-01".to_string(),
            seconds: 5400,
        },
        ReportDay {
            date: "2026-01-02".to_string(),
            seconds: 3600,
        },
    ];
    if variant == ReportVariant::Full {
        document.entries = Some(vec![an_entry(), a_project_patch_entry()]);
    }
    document
}

fn text(value: &str) -> CellValue {
    CellValue::Text(value.to_string())
}

fn money(amount_minor: u64, currency: &str) -> CellValue {
    CellValue::Money {
        amount_minor,
        currency: currency.to_string(),
    }
}

#[test]
fn test_given_full_document_when_building_model_then_has_summary_entries_and_days_sheets() {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Full);

    // Act
    let model = build_workbook_model(&document);

    // Assert
    let names: Vec<&str> = model.sheets().map(|sheet| sheet.name).collect();
    assert_eq!(names, ["Summary", "Entries", "Days"]);
}

#[test]
fn test_given_summary_document_when_building_model_then_has_only_the_summary_sheet() {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Summary);

    // Act
    let model = build_workbook_model(&document);

    // Assert
    assert!(model.entries.is_none());
    assert!(model.days.is_none());
    assert_eq!(model.sheets().count(), 1);
}

#[test]
fn test_given_two_currencies_when_building_summary_then_headers_have_one_amount_column_per_currency(
) {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Summary);

    // Act
    let model = build_workbook_model(&document);

    // Assert
    assert_eq!(
        model.summary.headers,
        [
            "Project",
            "Task",
            "Time",
            "Share",
            "Amount EUR",
            "Amount PLN"
        ]
    );
}

#[test]
fn test_given_projects_and_tasks_when_building_summary_then_projects_precede_tasks_and_total_is_last(
) {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Summary);

    // Act
    let model = build_workbook_model(&document);

    // Assert
    let kinds: Vec<RowKind> = model.summary.rows.iter().map(|row| row.kind).collect();
    assert_eq!(
        kinds,
        [
            RowKind::Project,
            RowKind::Project,
            RowKind::Task,
            RowKind::Task,
            RowKind::Task,
            RowKind::Total
        ]
    );
    assert_eq!(model.summary.row_span(RowKind::Project), Some((0, 1)));
}

#[test]
fn test_given_project_when_building_summary_then_row_carries_time_share_and_amount_per_currency() {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Summary);

    // Act
    let model = build_workbook_model(&document);

    // Assert
    assert_eq!(
        model.summary.rows[0].cells,
        [
            text("Alpha"),
            CellValue::Empty,
            CellValue::Duration { seconds: 5400 },
            CellValue::Share { basis_points: 6000 },
            CellValue::Empty,
            money(15_000, "PLN"),
        ]
    );
}

#[test]
fn test_given_task_with_priced_subtask_when_building_summary_then_amount_includes_the_subtask() {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Summary);

    // Act
    let model = build_workbook_model(&document);

    // Assert
    let design = &model.summary.rows[2].cells;
    assert_eq!(design[0], text("Alpha"));
    assert_eq!(design[1], text("Design"));
    assert_eq!(design[5], money(15_000, "PLN"));
}

#[test]
fn test_given_unpriced_task_when_building_summary_then_amount_cells_are_empty() {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Summary);

    // Act
    let model = build_workbook_model(&document);

    // Assert
    let review = &model.summary.rows[3].cells;
    assert_eq!(review[1], text("Review"));
    assert_eq!(review[4], CellValue::Empty);
    assert_eq!(review[5], CellValue::Empty);
}

#[test]
fn test_given_document_totals_when_building_summary_then_total_row_uses_document_totals() {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Summary);

    // Act
    let model = build_workbook_model(&document);

    // Assert
    let total = model.summary.rows.last().expect("total row");
    assert_eq!(
        total.cells,
        [
            text("Total"),
            CellValue::Empty,
            CellValue::Duration { seconds: 9000 },
            CellValue::Share {
                basis_points: 10_000
            },
            money(4000, "EUR"),
            money(15_000, "PLN"),
        ]
    );
}

#[test]
fn test_given_empty_report_when_building_summary_then_only_a_zero_total_row_remains() {
    // Arrange
    let mut document = a_document(ReportVariant::Full);
    document.totals.seconds = 0;
    document.totals.billing = vec![];
    document.projects = vec![];
    document.days = vec![];
    document.entries = Some(vec![]);

    // Act
    let model = build_workbook_model(&document);

    // Assert
    assert_eq!(model.summary.rows.len(), 1);
    assert_eq!(
        model.summary.rows[0].cells[2],
        CellValue::Duration { seconds: 0 }
    );
    assert_eq!(
        model.summary.rows[0].cells[3],
        CellValue::Share { basis_points: 0 }
    );
    assert!(model.entries.expect("entries sheet").rows.is_empty());
    assert!(model.days.expect("days sheet").rows.is_empty());
}

#[test]
fn test_given_entries_when_building_model_then_each_entry_is_one_typed_row() {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Full);

    // Act
    let model = build_workbook_model(&document);

    // Assert
    let entries = model.entries.expect("entries sheet");
    assert_eq!(
        entries.headers,
        ["Date", "Start", "End", "Project", "Task", "Note", "Time", "Amount"]
    );
    assert_eq!(
        entries.rows[0].cells,
        [
            CellValue::Date("2026-01-01".to_string()),
            CellValue::DateTime("2025-12-31T23:00:00Z".to_string()),
            CellValue::DateTime("2026-01-01T01:00:00Z".to_string()),
            text("Project"),
            text("Subtask"),
            text("note"),
            CellValue::Duration { seconds: 3600 },
            money(15_000, "PLN"),
        ]
    );
}

#[test]
fn test_given_running_patch_entry_without_amount_when_building_model_then_optional_cells_are_empty()
{
    // Arrange
    let mut document = a_two_currency_document(ReportVariant::Full);
    let mut running_patch = a_project_patch_entry();
    running_patch.end = None;
    running_patch.note = None;
    running_patch.amount_minor = None;
    document.entries = Some(vec![running_patch]);

    // Act
    let model = build_workbook_model(&document);

    // Assert
    let cells = &model.entries.expect("entries sheet").rows[0].cells;
    assert_eq!(cells[2], CellValue::Empty);
    assert_eq!(cells[4], CellValue::Empty);
    assert_eq!(cells[5], CellValue::Empty);
    assert_eq!(cells[7], CellValue::Empty);
}

#[test]
fn test_given_days_when_building_model_then_each_day_is_one_date_and_duration_row() {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Full);

    // Act
    let model = build_workbook_model(&document);

    // Assert
    let days = model.days.expect("days sheet");
    assert_eq!(days.headers, ["Date", "Time"]);
    assert_eq!(days.rows.len(), 2);
    assert_eq!(
        days.rows[1].cells,
        [
            CellValue::Date("2026-01-02".to_string()),
            CellValue::Duration { seconds: 3600 }
        ]
    );
}
