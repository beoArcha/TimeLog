// TODO: Remove this adapter once every exporter consumes ReportDocument directly (Phase 22, Group B).

use super::constants::{
    PERIOD_LABEL_ALL, PERIOD_LABEL_CUSTOM, PERIOD_LABEL_LAST_MONTH, PERIOD_LABEL_LAST_WEEK,
    PERIOD_LABEL_MONTH, PERIOD_LABEL_TEMPLATE, PERIOD_LABEL_TODAY, PERIOD_LABEL_WEEK,
    PERIOD_LABEL_YESTERDAY,
};
use super::{
    format_duration, ReportEntryDto, ReportProjectDto, ReportSubtaskDto, ReportTaskDto,
    ReportTreeDto,
};
use crate::types::{
    RangePreset, ReportDocument, ReportEntry, ReportProject, ReportSubtask, ReportTask,
    ResolvedRange,
};
use chrono::{DateTime, FixedOffset};

pub fn format_period_label(range: &ResolvedRange) -> String {
    let label = match range.preset {
        Some(RangePreset::Today) => PERIOD_LABEL_TODAY,
        Some(RangePreset::Yesterday) => PERIOD_LABEL_YESTERDAY,
        Some(RangePreset::Week) => PERIOD_LABEL_WEEK,
        Some(RangePreset::LastWeek) => PERIOD_LABEL_LAST_WEEK,
        Some(RangePreset::Month) => PERIOD_LABEL_MONTH,
        Some(RangePreset::LastMonth) => PERIOD_LABEL_LAST_MONTH,
        Some(RangePreset::All) => PERIOD_LABEL_ALL,
        None => PERIOD_LABEL_CUSTOM,
    };
    PERIOD_LABEL_TEMPLATE
        .replacen("{}", label, 1)
        .replacen("{}", &range.timezone, 1)
}

pub fn to_report_tree_dto(doc: &ReportDocument) -> ReportTreeDto {
    let total_secs = doc.totals.seconds;
    let projects = doc
        .projects
        .iter()
        .map(|p| map_project(p, total_secs))
        .collect();

    let entries = doc
        .entries
        .as_ref()
        .map(|entries| entries.iter().map(|e| map_entry(e, &doc.range)).collect())
        .unwrap_or_default();

    ReportTreeDto {
        period: format_period_label(&doc.range),
        total_seconds: total_secs,
        total_formatted: format_duration(total_secs),
        projects,
        entries,
    }
}

fn map_project(project: &ReportProject, total_seconds: u64) -> ReportProjectDto {
    let percentage = match total_seconds > 0 {
        true => (project.seconds as f64 / total_seconds as f64) * 100.0,
        false => 0.0,
    };

    let tasks = project
        .tasks
        .iter()
        .map(|t| map_task(t, total_seconds))
        .collect();

    ReportProjectDto {
        id: project.id.clone(),
        name: project.name.clone(),
        duration_seconds: project.seconds,
        duration_formatted: format_duration(project.seconds),
        percentage,
        tasks,
    }
}

fn map_task(task: &ReportTask, total_seconds: u64) -> ReportTaskDto {
    let percentage = match total_seconds > 0 {
        true => (task.seconds as f64 / total_seconds as f64) * 100.0,
        false => 0.0,
    };

    let subtasks = task
        .subtasks
        .iter()
        .map(|s| map_subtask(s, total_seconds))
        .collect();

    ReportTaskDto {
        id: task.id.clone(),
        name: task.name.clone(),
        duration_seconds: task.seconds,
        duration_formatted: format_duration(task.seconds),
        percentage,
        subtasks,
    }
}

fn map_subtask(subtask: &ReportSubtask, total_seconds: u64) -> ReportSubtaskDto {
    let percentage = match total_seconds > 0 {
        true => (subtask.seconds as f64 / total_seconds as f64) * 100.0,
        false => 0.0,
    };

    ReportSubtaskDto {
        id: subtask.id.clone(),
        name: subtask.name.clone(),
        duration_seconds: subtask.seconds,
        duration_formatted: format_duration(subtask.seconds),
        percentage,
    }
}

fn map_entry(entry: &ReportEntry, range: &ResolvedRange) -> ReportEntryDto {
    let (task_name, subtask_name) = match (&entry.parent_task_name, &entry.task_name) {
        (Some(parent), Some(child)) => (parent.clone(), Some(child.clone())),
        (None, Some(task)) => (task.clone(), None),
        _ => (String::new(), None),
    };

    let start_time = clamp_start(&entry.start, range.from.as_deref());
    let end_time = clamp_end(entry.end.as_deref(), range.to.as_deref());

    ReportEntryDto {
        id: entry.id.clone(),
        date: entry.date.clone(),
        project_name: entry.project_name.clone(),
        task_name,
        subtask_name,
        start_time,
        end_time,
        duration_seconds: entry.seconds,
        duration_formatted: format_duration(entry.seconds),
        note: entry.note.clone(),
    }
}

/// Entries keep their stored instants; the legacy DTO shows the in-range part in chrono's
/// `+00:00` RFC3339 form whether or not the range has bounds.
fn clamp_start(start: &str, range_from: Option<&str>) -> String {
    clamp_instant(start, range_from, std::cmp::max)
}

fn clamp_end(end: Option<&str>, range_to: Option<&str>) -> Option<String> {
    end.map(|end_str| clamp_instant(end_str, range_to, std::cmp::min))
}

/// The engine already validated every instant, so an unparseable value cannot reach here; it is
/// echoed unchanged rather than dropped.
fn clamp_instant(
    instant: &str,
    bound: Option<&str>,
    pick: fn(DateTime<FixedOffset>, DateTime<FixedOffset>) -> DateTime<FixedOffset>,
) -> String {
    let Ok(instant_dt) = DateTime::parse_from_rfc3339(instant) else {
        return instant.to_string();
    };
    bound
        .and_then(|raw| DateTime::parse_from_rfc3339(raw).ok())
        .map_or(instant_dt, |bound_dt| pick(instant_dt, bound_dt))
        .to_rfc3339()
}
