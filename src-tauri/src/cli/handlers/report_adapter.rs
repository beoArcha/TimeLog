// TODO: Remove this adapter once exporters consume ReportDocument directly (R4).

use super::constants::{
    PERIOD_LABEL_ALL, PERIOD_LABEL_CUSTOM, PERIOD_LABEL_LAST_MONTH, PERIOD_LABEL_LAST_WEEK,
    PERIOD_LABEL_MONTH, PERIOD_LABEL_TEMPLATE, PERIOD_LABEL_TODAY, PERIOD_LABEL_WEEK,
    PERIOD_LABEL_YESTERDAY,
};
use crate::cli::formatters::{
    format_duration, ReportEntryDto, ReportProjectDto, ReportSubtaskDto, ReportTaskDto,
    ReportTreeDto,
};
use crate::types::{
    RangePreset, ReportDocument, ReportEntry, ReportProject, ReportSubtask, ReportTask,
    ResolvedRange,
};
use chrono::DateTime;

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

fn clamp_start(start: &str, range_from: Option<&str>) -> String {
    let Some(from_str) = range_from else {
        return start.to_string();
    };

    let (Ok(start_dt), Ok(from_dt)) = (
        DateTime::parse_from_rfc3339(start),
        DateTime::parse_from_rfc3339(from_str),
    ) else {
        return start.to_string();
    };

    std::cmp::max(start_dt, from_dt).to_rfc3339()
}

fn clamp_end(end: Option<&str>, range_to: Option<&str>) -> Option<String> {
    let end_str = end?;
    let Some(to_str) = range_to else {
        return Some(end_str.to_string());
    };

    let (Ok(end_dt), Ok(to_dt)) = (
        DateTime::parse_from_rfc3339(end_str),
        DateTime::parse_from_rfc3339(to_str),
    ) else {
        return Some(end_str.to_string());
    };

    Some(std::cmp::min(end_dt, to_dt).to_rfc3339())
}
