//! Report Rows Flattening Module with Strict Domain Invariant Validation.
//!
//! # Time Hierarchy and Domain Invariants
//!
//! In TimeLog, time logs are associated with tasks or subtasks:
//! - Direct time on a root task: logged directly with `task_id == root_task.id`.
//! - Subtask time: logged with `task_id == sub.id` (where `sub.parent_task_id == Some(root_task.id)`).
//!
//! When constructing `ReportTaskDto`, the parent task's `duration_seconds` is aggregated as:
//! `task.duration_seconds = direct_secs + sum(subtasks.duration_seconds)`.
//!
//! ## Invariants:
//! 1. **Overflow Safety**: Summation of subtask durations must not overflow `u64`.
//! 2. **Parent Duration Invariant**: A task's total duration must be greater than or equal to the sum
//!    of its subtasks (`task.duration_seconds >= subtasks_secs`).
//!
//! Any violation of these invariants indicates inconsistent or corrupted report data. Rather than
//! silently masking anomalies via `saturating_sub`, this module enforces strict validation and
//! returns strongly-typed [`RowsError`] variants.

use crate::cli::error::{CliError, SinkError};
use crate::cli::formatters::{format_duration, ReportProjectDto, ReportTaskDto, ReportTreeDto};
use thiserror::Error;

#[derive(Debug, PartialEq, Eq, Clone, Error)]
pub enum RowsError {
    #[error(
        "Subtask duration sum ({subtasks_secs}s) exceeds parent task duration ({task_secs}s) for task '{task_name}' ({task_id})"
    )]
    SubtaskDurationExceedsParent {
        task_id: String,
        task_name: String,
        task_secs: u64,
        subtasks_secs: u64,
    },
    #[error(
        "Subtask duration summation caused integer overflow for task '{task_name}' ({task_id})"
    )]
    SubtaskDurationOverflow { task_id: String, task_name: String },
}

impl From<RowsError> for CliError {
    fn from(err: RowsError) -> Self {
        CliError::Sink(SinkError::Serialization(err.to_string()))
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct ReportRow {
    pub project_id: String,
    pub project_name: String,
    pub task_id: String,
    pub task_name: String,
    pub subtask_id: Option<String>,
    pub subtask_name: Option<String>,
    pub duration_seconds: u64,
    pub duration_formatted: String,
    pub percentage: f64,
}

pub fn flatten_report(tree: &ReportTreeDto) -> Result<Vec<ReportRow>, RowsError> {
    let mut all_rows = Vec::new();
    for project in &tree.projects {
        let rows = flatten_project(project)?;
        all_rows.extend(rows);
    }
    Ok(all_rows)
}

pub fn flatten_project(project: &ReportProjectDto) -> Result<Vec<ReportRow>, RowsError> {
    let mut rows = Vec::new();
    for task in &project.tasks {
        let task_rows = flatten_task(&project.id, &project.name, task)?;
        rows.extend(task_rows);
    }
    Ok(rows)
}

pub fn flatten_task(
    project_id: &str,
    project_name: &str,
    task: &ReportTaskDto,
) -> Result<Vec<ReportRow>, RowsError> {
    if task.subtasks.is_empty() {
        return Ok(vec![ReportRow {
            project_id: project_id.to_string(),
            project_name: project_name.to_string(),
            task_id: task.id.clone(),
            task_name: task.name.clone(),
            subtask_id: None,
            subtask_name: None,
            duration_seconds: task.duration_seconds,
            duration_formatted: task.duration_formatted.clone(),
            percentage: task.percentage,
        }]);
    }

    let subtasks_secs = task
        .subtasks
        .iter()
        .try_fold(0u64, |acc, s| acc.checked_add(s.duration_seconds))
        .ok_or_else(|| RowsError::SubtaskDurationOverflow {
            task_id: task.id.clone(),
            task_name: task.name.clone(),
        })?;

    if subtasks_secs > task.duration_seconds {
        return Err(RowsError::SubtaskDurationExceedsParent {
            task_id: task.id.clone(),
            task_name: task.name.clone(),
            task_secs: task.duration_seconds,
            subtasks_secs,
        });
    }

    let direct_secs = task.duration_seconds - subtasks_secs;
    let direct_pct = if task.duration_seconds > 0 {
        (direct_secs as f64 / task.duration_seconds as f64) * task.percentage
    } else {
        0.0
    };

    let mut rows = Vec::new();

    if direct_secs > 0 {
        rows.push(ReportRow {
            project_id: project_id.to_string(),
            project_name: project_name.to_string(),
            task_id: task.id.clone(),
            task_name: task.name.clone(),
            subtask_id: None,
            subtask_name: None,
            duration_seconds: direct_secs,
            duration_formatted: format_duration(direct_secs),
            percentage: direct_pct,
        });
    }

    for subtask in &task.subtasks {
        rows.push(ReportRow {
            project_id: project_id.to_string(),
            project_name: project_name.to_string(),
            task_id: task.id.clone(),
            task_name: task.name.clone(),
            subtask_id: Some(subtask.id.clone()),
            subtask_name: Some(subtask.name.clone()),
            duration_seconds: subtask.duration_seconds,
            duration_formatted: subtask.duration_formatted.clone(),
            percentage: subtask.percentage,
        });
    }

    Ok(rows)
}
