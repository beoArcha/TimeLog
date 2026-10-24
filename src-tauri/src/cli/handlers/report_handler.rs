use super::constants::{
    PERIOD_LABEL_ALL, PERIOD_LABEL_MONTH, PERIOD_LABEL_TODAY, PERIOD_LABEL_WEEK,
};
use crate::cli::error::CliError;
use crate::cli::exporters::constants::MSG_EXPORT_SUCCESS;
use crate::cli::exporters::export_to_file;
use crate::cli::formatters::{
    format_duration, render_tree_string, ReportProjectDto, ReportSubtaskDto, ReportTaskDto,
    ReportTreeDto,
};
use crate::cli::parser::{ReportArgs, ReportSubcommand};
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{ElapsedRangeFilter, Project, RangeMetricsResult, Task};
use chrono::{Datelike, Utc};
use std::collections::HashMap;

pub fn handle(
    args: ReportArgs,
    is_machine: bool,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    match args.command {
        Some(ReportSubcommand::Export { format, output }) => {
            let tree = build_report_tree(args.today, args.week, args.month, persistence, engine)?;
            export_to_file(&tree, format, &output)?;
            let msg = MSG_EXPORT_SUCCESS.replacen("{}", &output, 1).replacen(
                "{}",
                &format!("{:?}", format).to_lowercase(),
                1,
            );
            if is_machine {
                let json = serde_json::json!({
                    "status": "success",
                    "exported_path": output,
                    "format": format!("{:?}", format).to_lowercase(),
                    "total_seconds": tree.total_seconds
                });
                return Ok(CliOutput::Json(json.to_string()));
            }
            Ok(CliOutput::Success(msg))
        }
        Some(ReportSubcommand::Tree { today, week, month }) => {
            let tree = build_report_tree(today, week, month, persistence, engine)?;
            render_tree_output(&tree, is_machine)
        }
        None => {
            let tree = build_report_tree(args.today, args.week, args.month, persistence, engine)?;
            render_tree_output(&tree, is_machine)
        }
    }
}

fn render_tree_output(tree: &ReportTreeDto, is_machine: bool) -> Result<CliOutput, CliError> {
    if is_machine {
        let json = serde_json::to_string_pretty(tree)?;
        Ok(CliOutput::Json(json))
    } else {
        Ok(CliOutput::Success(render_tree_string(tree)))
    }
}

pub fn build_report_tree(
    today: bool,
    week: bool,
    month: bool,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<ReportTreeDto, CliError> {
    let (from_iso, period_label) = determine_period_bounds(today, week, month);

    let filter = ElapsedRangeFilter {
        project_id: None,
        task_id: None,
        from: from_iso,
        to: None,
        include_patches: Some(true),
    };

    let metrics = engine.calculate_range_metrics(&filter, None)?;
    let all_projects = persistence.projects.get_all()?;
    let all_tasks = persistence.tasks.get_all()?;

    let project_map: HashMap<String, Project> = all_projects
        .into_iter()
        .map(|p| (p.id.clone(), p))
        .collect();

    let mut subtasks_by_parent: HashMap<String, Vec<Task>> = HashMap::new();
    let mut root_tasks_by_project: HashMap<String, Vec<Task>> = HashMap::new();

    for t in all_tasks {
        match t.parent_task_id {
            Some(ref pid) => subtasks_by_parent.entry(pid.clone()).or_default().push(t),
            None => root_tasks_by_project
                .entry(t.project_id.clone())
                .or_default()
                .push(t),
        }
    }

    let total_secs = metrics.total_seconds;
    let mut project_dtos: Vec<ReportProjectDto> = metrics
        .project_elapsed
        .iter()
        .filter(|(_, elapsed)| **elapsed > 0)
        .map(|(p_id, p_elapsed)| {
            build_project_dto(
                p_id,
                *p_elapsed,
                total_secs,
                &project_map,
                root_tasks_by_project.get(p_id),
                &subtasks_by_parent,
                &metrics,
            )
        })
        .collect();

    project_dtos.sort_by_key(|a| std::cmp::Reverse(a.duration_seconds));

    Ok(ReportTreeDto {
        period: period_label.to_string(),
        total_seconds: total_secs,
        total_formatted: format_duration(total_secs),
        projects: project_dtos,
    })
}

fn determine_period_bounds(today: bool, week: bool, month: bool) -> (Option<String>, &'static str) {
    let now = Utc::now();
    if today {
        let midnight = now.date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc();
        return (Some(midnight.to_rfc3339()), PERIOD_LABEL_TODAY);
    }
    if week {
        let days = now.weekday().num_days_from_monday();
        let monday = (now - chrono::Duration::days(days as i64))
            .date_naive()
            .and_hms_opt(0, 0, 0)
            .unwrap()
            .and_utc();
        return (Some(monday.to_rfc3339()), PERIOD_LABEL_WEEK);
    }
    if month {
        let first = chrono::NaiveDate::from_ymd_opt(now.year(), now.month(), 1)
            .unwrap()
            .and_hms_opt(0, 0, 0)
            .unwrap()
            .and_utc();
        return (Some(first.to_rfc3339()), PERIOD_LABEL_MONTH);
    }
    (None, PERIOD_LABEL_ALL)
}

fn build_project_dto(
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

fn build_task_dto(
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
