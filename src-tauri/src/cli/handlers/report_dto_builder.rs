use crate::cli::formatters::{
    format_duration, ReportEntryDto, ReportProjectDto, ReportSubtaskDto, ReportTaskDto,
};
use crate::types::{ClampedTimeLog, Project, RangeMetricsResult, Task};
use std::collections::HashMap;

pub fn build_project_dto(
    p_id: &str,
    p_elapsed: u64,
    total_secs: u64,
    project_map: &HashMap<String, Project>,
    roots: Option<&Vec<Task>>,
    subtasks_by_parent: &HashMap<String, Vec<Task>>,
    metrics: &RangeMetricsResult,
) -> ReportProjectDto {
    let p_name = project_map
        .get(p_id)
        .map(|p| p.name.clone())
        .unwrap_or_else(|| p_id.to_string());

    let p_pct = match total_secs > 0 {
        true => (p_elapsed as f64 / total_secs as f64) * 100.0,
        false => 0.0,
    };

    let mut task_dtos: Vec<ReportTaskDto> = roots
        .map(|tasks| {
            tasks
                .iter()
                .filter_map(|root_task| {
                    build_task_dto(
                        root_task,
                        subtasks_by_parent.get(&root_task.id),
                        metrics,
                        total_secs,
                    )
                })
                .collect()
        })
        .unwrap_or_default();

    task_dtos.sort_by_key(|a| std::cmp::Reverse(a.duration_seconds));

    ReportProjectDto {
        id: p_id.to_string(),
        name: p_name,
        duration_seconds: p_elapsed,
        duration_formatted: format_duration(p_elapsed),
        percentage: p_pct,
        tasks: task_dtos,
    }
}

pub fn build_task_dto(
    root_task: &Task,
    subs: Option<&Vec<Task>>,
    metrics: &RangeMetricsResult,
    total_secs: u64,
) -> Option<ReportTaskDto> {
    let mut task_secs = *metrics.task_elapsed.get(&root_task.id).unwrap_or(&0);

    let mut subtask_dtos: Vec<ReportSubtaskDto> = subs
        .map(|subtasks| {
            subtasks
                .iter()
                .filter_map(|sub| {
                    let sub_secs = *metrics.task_elapsed.get(&sub.id).unwrap_or(&0);
                    if sub_secs == 0 {
                        return None;
                    }
                    let sub_pct = match total_secs > 0 {
                        true => (sub_secs as f64 / total_secs as f64) * 100.0,
                        false => 0.0,
                    };
                    Some(ReportSubtaskDto {
                        id: sub.id.clone(),
                        name: sub.name.clone(),
                        duration_seconds: sub_secs,
                        duration_formatted: format_duration(sub_secs),
                        percentage: sub_pct,
                    })
                })
                .collect()
        })
        .unwrap_or_default();

    for sub in &subtask_dtos {
        task_secs += sub.duration_seconds;
    }

    if task_secs == 0 {
        return None;
    }

    let task_pct = match total_secs > 0 {
        true => (task_secs as f64 / total_secs as f64) * 100.0,
        false => 0.0,
    };

    subtask_dtos.sort_by_key(|a| std::cmp::Reverse(a.duration_seconds));

    Some(ReportTaskDto {
        id: root_task.id.clone(),
        name: root_task.name.clone(),
        duration_seconds: task_secs,
        duration_formatted: format_duration(task_secs),
        percentage: task_pct,
        subtasks: subtask_dtos,
    })
}

pub fn build_entry_dtos(
    clamped_logs: &[ClampedTimeLog],
    project_map: &HashMap<String, Project>,
    task_map: &HashMap<String, Task>,
) -> Vec<ReportEntryDto> {
    clamped_logs
        .iter()
        .map(|log| {
            let (task_name, subtask_name) = match task_map.get(&log.task_id) {
                Some(task) => match &task.parent_task_id {
                    Some(parent_id) => {
                        let parent_name = task_map
                            .get(parent_id)
                            .map(|p| p.name.clone())
                            .unwrap_or_else(|| parent_id.clone());
                        (parent_name, Some(task.name.clone()))
                    }
                    None => (task.name.clone(), None),
                },
                None => (log.task_id.clone(), None),
            };

            let project_name = project_map
                .get(&log.project_id)
                .map(|p| p.name.clone())
                .unwrap_or_else(|| log.project_id.clone());

            let date = if log.clamped_start_time.len() >= 10 {
                log.clamped_start_time[0..10].to_string()
            } else {
                log.clamped_start_time.clone()
            };

            let end_time = if log.clamped_end_time.is_empty() {
                None
            } else {
                Some(log.clamped_end_time.clone())
            };

            ReportEntryDto {
                id: log.id.clone(),
                date,
                project_name,
                task_name,
                subtask_name,
                start_time: log.clamped_start_time.clone(),
                end_time,
                duration_seconds: log.clamped_duration_seconds,
                duration_formatted: format_duration(log.clamped_duration_seconds),
                note: log.note.clone(),
            }
        })
        .collect()
}
