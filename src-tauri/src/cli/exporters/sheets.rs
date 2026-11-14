use super::constants::{
    SHEET_HEADER_AMOUNT, SHEET_HEADER_AMOUNT_IN_CURRENCY, SHEET_HEADER_DATE, SHEET_HEADER_END,
    SHEET_HEADER_NOTE, SHEET_HEADER_PROJECT, SHEET_HEADER_SHARE, SHEET_HEADER_START,
    SHEET_HEADER_TASK, SHEET_HEADER_TIME, SHEET_NAME_DAYS, SHEET_NAME_ENTRIES, SHEET_NAME_SUMMARY,
    SHEET_TOTAL_LABEL,
};
use crate::types::{
    ReportBillingTotal, ReportDay, ReportDocument, ReportEntry, ReportProject, ReportTask,
    ReportVariant,
};

pub const SUMMARY_TIME_COLUMN: u16 = 2;
pub const SUMMARY_SHARE_COLUMN: u16 = 3;
pub const DAYS_DATE_COLUMN: u16 = 0;
pub const DAYS_TIME_COLUMN: u16 = 1;
const SUMMARY_LEADING_COLUMNS: usize = 4;
const FULL_SHARE_BASIS_POINTS: u32 = 10_000;

/// A cell value that keeps its meaning, so each format picks its own native representation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CellValue {
    Empty,
    Text(String),
    Duration {
        seconds: u64,
    },
    Share {
        basis_points: u32,
    },
    Money {
        amount_minor: u64,
        currency: String,
    },
    /// Local `YYYY-MM-DD`.
    Date(String),
    /// RFC3339 UTC instant with whole seconds.
    DateTime(String),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RowKind {
    Project,
    Task,
    Entry,
    Day,
    Total,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SheetRow {
    pub kind: RowKind,
    pub cells: Vec<CellValue>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SheetModel {
    pub name: &'static str,
    pub headers: Vec<String>,
    pub rows: Vec<SheetRow>,
}

impl SheetModel {
    /// Indices into `rows` of the first and last row of `kind`; rows of one kind are contiguous.
    pub fn row_span(&self, kind: RowKind) -> Option<(usize, usize)> {
        let first = self.rows.iter().position(|row| row.kind == kind)?;
        let last = self.rows.iter().rposition(|row| row.kind == kind)?;
        Some((first, last))
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorkbookModel {
    pub summary: SheetModel,
    /// Present only for the `full` variant.
    pub entries: Option<SheetModel>,
    /// Present only for the `full` variant.
    pub days: Option<SheetModel>,
}

impl WorkbookModel {
    pub fn sheets(&self) -> impl Iterator<Item = &SheetModel> {
        std::iter::once(&self.summary)
            .chain(self.entries.iter())
            .chain(self.days.iter())
    }
}

pub fn build_workbook_model(document: &ReportDocument) -> WorkbookModel {
    let is_full = document.variant == ReportVariant::Full;
    WorkbookModel {
        summary: summary_sheet(document),
        entries: document
            .entries
            .as_deref()
            .filter(|_| is_full)
            .map(entries_sheet),
        days: is_full.then(|| days_sheet(&document.days)),
    }
}

fn text(value: &str) -> CellValue {
    CellValue::Text(value.to_string())
}

fn optional_text(value: Option<&str>) -> CellValue {
    value.map_or(CellValue::Empty, text)
}

fn money(amount_minor: u64, currency: &str) -> CellValue {
    CellValue::Money {
        amount_minor,
        currency: currency.to_string(),
    }
}

fn header_cells(headers: &[&str]) -> Vec<String> {
    headers.iter().map(|header| header.to_string()).collect()
}

fn summary_sheet(document: &ReportDocument) -> SheetModel {
    let currencies: Vec<&str> = document
        .totals
        .billing
        .iter()
        .map(|total| total.currency.as_str())
        .collect();
    let mut headers = header_cells(&[
        SHEET_HEADER_PROJECT,
        SHEET_HEADER_TASK,
        SHEET_HEADER_TIME,
        SHEET_HEADER_SHARE,
    ]);
    headers.extend(
        currencies
            .iter()
            .map(|currency| SHEET_HEADER_AMOUNT_IN_CURRENCY.replacen("{}", currency, 1)),
    );

    // Projects come first and contiguous so the pie chart reads a single range.
    let project_rows = document
        .projects
        .iter()
        .map(|project| project_row(project, &currencies));
    let task_rows = document.projects.iter().flat_map(|project| {
        project
            .tasks
            .iter()
            .map(|task| task_row(project, task, &currencies))
    });
    let rows = project_rows
        .chain(task_rows)
        .chain(std::iter::once(total_row(document, &currencies)))
        .collect();

    SheetModel {
        name: SHEET_NAME_SUMMARY,
        headers,
        rows,
    }
}

fn summary_row(
    kind: RowKind,
    leading: [CellValue; SUMMARY_LEADING_COLUMNS],
    amounts: impl Iterator<Item = CellValue>,
) -> SheetRow {
    let mut cells = Vec::from(leading);
    cells.extend(amounts);
    SheetRow { kind, cells }
}

fn project_row(project: &ReportProject, currencies: &[&str]) -> SheetRow {
    summary_row(
        RowKind::Project,
        [
            text(&project.name),
            CellValue::Empty,
            CellValue::Duration {
                seconds: project.seconds,
            },
            CellValue::Share {
                basis_points: project.share_basis_points,
            },
        ],
        currencies
            .iter()
            .map(|currency| billing_amount(&project.billing, currency)),
    )
}

fn task_row(project: &ReportProject, task: &ReportTask, currencies: &[&str]) -> SheetRow {
    summary_row(
        RowKind::Task,
        [
            text(&project.name),
            text(&task.name),
            CellValue::Duration {
                seconds: task.seconds,
            },
            CellValue::Share {
                basis_points: task.share_basis_points,
            },
        ],
        currencies
            .iter()
            .map(|currency| task_amount(task, currency)),
    )
}

fn total_row(document: &ReportDocument, currencies: &[&str]) -> SheetRow {
    let totals = &document.totals;
    let share = if totals.seconds > 0 {
        FULL_SHARE_BASIS_POINTS
    } else {
        0
    };
    summary_row(
        RowKind::Total,
        [
            text(SHEET_TOTAL_LABEL),
            CellValue::Empty,
            CellValue::Duration {
                seconds: totals.seconds,
            },
            CellValue::Share {
                basis_points: share,
            },
        ],
        currencies
            .iter()
            .map(|currency| billing_amount(&totals.billing, currency)),
    )
}

fn billing_amount(billing: &[ReportBillingTotal], currency: &str) -> CellValue {
    billing
        .iter()
        .find(|total| total.currency == currency)
        .map_or(CellValue::Empty, |total| {
            money(total.amount_minor, currency)
        })
}

/// A task amount covers its direct time only, while the task's seconds include subtasks, so the
/// row adds each subtask's own amount to stay comparable with the time column.
fn task_amount(task: &ReportTask, currency: &str) -> CellValue {
    let own = std::iter::once((task.currency.as_deref(), task.amount_minor));
    let subtasks = task
        .subtasks
        .iter()
        .map(|subtask| (subtask.currency.as_deref(), subtask.amount_minor));
    let amounts: Vec<u64> = own
        .chain(subtasks)
        .filter(|(own_currency, _)| *own_currency == Some(currency))
        .filter_map(|(_, amount)| amount)
        .collect();
    if amounts.is_empty() {
        return CellValue::Empty;
    }
    // The engine already rejects overflowing per-currency totals, which bound this sum.
    let total = amounts
        .iter()
        .fold(0u64, |sum, amount| sum.saturating_add(*amount));
    money(total, currency)
}

fn entries_sheet(entries: &[ReportEntry]) -> SheetModel {
    SheetModel {
        name: SHEET_NAME_ENTRIES,
        headers: header_cells(&[
            SHEET_HEADER_DATE,
            SHEET_HEADER_START,
            SHEET_HEADER_END,
            SHEET_HEADER_PROJECT,
            SHEET_HEADER_TASK,
            SHEET_HEADER_NOTE,
            SHEET_HEADER_TIME,
            SHEET_HEADER_AMOUNT,
        ]),
        rows: entries.iter().map(entry_row).collect(),
    }
}

fn entry_row(entry: &ReportEntry) -> SheetRow {
    let amount = match (entry.amount_minor, entry.currency.as_deref()) {
        (Some(amount_minor), Some(currency)) => money(amount_minor, currency),
        _ => CellValue::Empty,
    };
    // A running entry has no end yet.
    let end = entry
        .end
        .as_ref()
        .map_or(CellValue::Empty, |end| CellValue::DateTime(end.clone()));
    SheetRow {
        kind: RowKind::Entry,
        cells: vec![
            CellValue::Date(entry.date.clone()),
            CellValue::DateTime(entry.start.clone()),
            end,
            text(&entry.project_name),
            optional_text(entry.task_name.as_deref()),
            optional_text(entry.note.as_deref()),
            CellValue::Duration {
                seconds: entry.seconds,
            },
            amount,
        ],
    }
}

fn days_sheet(days: &[ReportDay]) -> SheetModel {
    SheetModel {
        name: SHEET_NAME_DAYS,
        headers: header_cells(&[SHEET_HEADER_DATE, SHEET_HEADER_TIME]),
        rows: days
            .iter()
            .map(|day| SheetRow {
                kind: RowKind::Day,
                cells: vec![
                    CellValue::Date(day.date.clone()),
                    CellValue::Duration {
                        seconds: day.seconds,
                    },
                ],
            })
            .collect(),
    }
}
