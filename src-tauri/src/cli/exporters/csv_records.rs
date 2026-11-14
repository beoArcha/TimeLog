use super::constants::{
    CSV_BILLING_STATUS_CUSTOM, CSV_BILLING_STATUS_INHERITED, CSV_BILLING_STATUS_NON_BILLABLE,
    CSV_BILLING_STATUS_UNCONFIGURED,
};
use super::csv_sanitize::sanitize_csv_formula;
use crate::types::{
    ReportDocument, ReportEntry, ReportProject, ReportRateStatus, ReportSubtask, ReportTask,
};

/// Cells of one row; text cells are already neutralized against formula injection.
pub type Record = Vec<String>;

const SECONDS_PER_HOUR: u128 = 3600;
const MINOR_UNITS_PER_MAJOR: u64 = 100;

/// Tasks and subtasks share every figure the summary table shows.
struct TaskFigures<'a> {
    id: &'a str,
    name: &'a str,
    parent_id: Option<&'a str>,
    direct_seconds: u64,
    seconds: u64,
    share_basis_points: u32,
    rate_minor: Option<u64>,
    currency: Option<&'a str>,
    rate_status: ReportRateStatus,
    amount_minor: Option<u64>,
}

impl<'a> From<&'a ReportTask> for TaskFigures<'a> {
    fn from(task: &'a ReportTask) -> Self {
        Self {
            id: &task.id,
            name: &task.name,
            parent_id: None,
            direct_seconds: task.direct_seconds,
            seconds: task.seconds,
            share_basis_points: task.share_basis_points,
            rate_minor: task.rate_minor,
            currency: task.currency.as_deref(),
            rate_status: task.rate_status,
            amount_minor: task.amount_minor,
        }
    }
}

impl<'a> From<&'a ReportSubtask> for TaskFigures<'a> {
    fn from(subtask: &'a ReportSubtask) -> Self {
        Self {
            id: &subtask.id,
            name: &subtask.name,
            parent_id: Some(&subtask.parent_task_id),
            direct_seconds: subtask.direct_seconds,
            seconds: subtask.seconds,
            share_basis_points: subtask.share_basis_points,
            rate_minor: subtask.rate_minor,
            currency: subtask.currency.as_deref(),
            rate_status: subtask.rate_status,
            amount_minor: subtask.amount_minor,
        }
    }
}

/// Document order: per project its task-less time, then every root task followed by its subtasks.
pub fn summary_records(document: &ReportDocument) -> Vec<Record> {
    let mut records = Vec::new();
    for project in &document.projects {
        if project.direct_seconds > 0 {
            records.push(project_time_record(project));
        }
        for task in &project.tasks {
            records.push(task_record(project, &TaskFigures::from(task)));
            for subtask in &task.subtasks {
                records.push(task_record(project, &TaskFigures::from(subtask)));
            }
        }
    }
    records
}

pub fn full_records(document: &ReportDocument) -> Vec<Record> {
    document
        .entries
        .iter()
        .flatten()
        .map(entry_record)
        .collect()
}

/// Time logged on the project itself, kept as a row so `directSeconds` sums to the document total.
fn project_time_record(project: &ReportProject) -> Record {
    vec![
        text(&project.id),
        text(&project.name),
        String::new(),
        String::new(),
        String::new(),
        project.direct_seconds.to_string(),
        project.direct_seconds.to_string(),
        format_hours(project.direct_seconds),
        String::new(),
        String::new(),
        String::new(),
        String::new(),
        String::new(),
    ]
}

fn task_record(project: &ReportProject, task: &TaskFigures<'_>) -> Record {
    vec![
        text(&project.id),
        text(&project.name),
        text(task.id),
        text(task.name),
        text(task.parent_id.unwrap_or_default()),
        task.seconds.to_string(),
        task.direct_seconds.to_string(),
        format_hours(task.seconds),
        task.share_basis_points.to_string(),
        task.rate_minor.map(format_minor_units).unwrap_or_default(),
        task.amount_minor
            .map(format_minor_units)
            .unwrap_or_default(),
        text(task.currency.unwrap_or_default()),
        billing_status(task.rate_status).to_string(),
    ]
}

fn entry_record(entry: &ReportEntry) -> Record {
    vec![
        text(&entry.id),
        text(&entry.project_id),
        text(&entry.project_name),
        text(entry.task_id.as_deref().unwrap_or_default()),
        text(entry.task_name.as_deref().unwrap_or_default()),
        text(&entry.date),
        text(&entry.start),
        text(entry.end.as_deref().unwrap_or_default()),
        entry.seconds.to_string(),
        text(entry.note.as_deref().unwrap_or_default()),
        entry
            .amount_minor
            .map(format_minor_units)
            .unwrap_or_default(),
        text(entry.currency.as_deref().unwrap_or_default()),
    ]
}

fn text(value: &str) -> String {
    sanitize_csv_formula(value)
}

fn billing_status(status: ReportRateStatus) -> &'static str {
    match status {
        ReportRateStatus::Inherited => CSV_BILLING_STATUS_INHERITED,
        ReportRateStatus::Custom => CSV_BILLING_STATUS_CUSTOM,
        ReportRateStatus::NonBillable => CSV_BILLING_STATUS_NON_BILLABLE,
        ReportRateStatus::Unconfigured => CSV_BILLING_STATUS_UNCONFIGURED,
    }
}

/// Two decimals with a dot and no grouping; integer arithmetic keeps the output independent of
/// locale and float formatting. Hundredths of an hour round half up.
fn format_hours(seconds: u64) -> String {
    let hundredths = (u128::from(seconds) * 100 + SECONDS_PER_HOUR / 2) / SECONDS_PER_HOUR;
    format!("{}.{:02}", hundredths / 100, hundredths % 100)
}

fn format_minor_units(minor: u64) -> String {
    format!(
        "{}.{:02}",
        minor / MINOR_UNITS_PER_MAJOR,
        minor % MINOR_UNITS_PER_MAJOR
    )
}
