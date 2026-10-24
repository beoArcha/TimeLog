use super::constants::{
    ERR_DATE_RANGE_INVALID, ERR_TASK_NOT_IN_PROJECT, PERIOD_LABEL_ALL, PERIOD_LABEL_CUSTOM,
    PERIOD_LABEL_MONTH, PERIOD_LABEL_TODAY, PERIOD_LABEL_WEEK,
};
use crate::cli::error::CliError;
use crate::cli::exporters::constants::MSG_EXPORT_SUCCESS;
use crate::cli::exporters::export_to_file;
use crate::cli::formatters::{
    format_duration, render_tree_string, ReportProjectDto, ReportSubtaskDto, ReportTaskDto,
    ReportTreeDto,
};
use crate::cli::parser::{ReportArgs, ReportSubcommand};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::parse_date_bound;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{ElapsedRangeFilter, Project, RangeMetricsResult, Task};
use chrono::{Datelike, Utc};
use std::collections::HashMap;

#[derive(Debug, Clone, Default)]
pub struct ReportFilterCriteria {
    pub today: bool,
    pub week: bool,
    pub month: bool,
    pub project: Option<String>,
    pub task: Option<String>,
    pub from: Option<String>,
    pub to: Option<String>,
}

pub fn handle(
    args: ReportArgs,
    is_machine: bool,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    let criteria = extract_filter_criteria(&args);

    if let Some(ReportSubcommand::Export { format, output, .. }) = args.command {
        let tree = build_report_tree(&criteria, is_machine, persistence, engine)?;
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
        return Ok(CliOutput::Success(msg));
    }

    let tree = build_report_tree(&criteria, is_machine, persistence, engine)?;
    render_tree_output(&tree, is_machine)
}

fn extract_filter_criteria(args: &ReportArgs) -> ReportFilterCriteria {
    match &args.command {
        Some(ReportSubcommand::Export {
            today,
            week,
            month,
            project,
            task,
            from,
            to,
            ..
        }) => ReportFilterCriteria {
            today: *today || args.today,
            week: *week || args.week,
            month: *month || args.month,
            project: project.clone().or_else(|| args.project.clone()),
            task: task.clone().or_else(|| args.task.clone()),
            from: from.clone().or_else(|| args.from.clone()),
            to: to.clone().or_else(|| args.to.clone()),
        },
        Some(ReportSubcommand::Tree {
            today,
            week,
            month,
            project,
            task,
            from,
            to,
        }) => ReportFilterCriteria {
            today: *today || args.today,
            week: *week || args.week,
            month: *month || args.month,
            project: project.clone().or_else(|| args.project.clone()),
            task: task.clone().or_else(|| args.task.clone()),
            from: from.clone().or_else(|| args.from.clone()),
            to: to.clone().or_else(|| args.to.clone()),
        },
        None => ReportFilterCriteria {
            today: args.today,
            week: args.week,
            month: args.month,
            project: args.project.clone(),
            task: args.task.clone(),
            from: args.from.clone(),
            to: args.to.clone(),
        },
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
    criteria: &ReportFilterCriteria,
    is_machine: bool,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<ReportTreeDto, CliError> {
    let (from_iso, to_iso, period_label) = determine_bounds(criteria)?;

    let resolved_project_id = match &criteria.project {
        Some(target) => {
            let resolver = EntityResolver::with_mode(persistence, is_machine);
            let p = resolver.resolve_project(target)?;
            Some(p.id)
        }
        None => None,
    };

    let resolved_task = match &criteria.task {
        Some(target) => {
            let resolver = EntityResolver::with_mode(persistence, is_machine);
            let t = resolver.resolve_task(target)?;
            Some(t)
        }
        None => None,
    };

    if let (Some(ref p_id), Some(ref task)) = (&resolved_project_id, &resolved_task) {
        if &task.project_id != p_id {
            return Err(CliError::business_custom(
                ERR_TASK_NOT_IN_PROJECT
                    .replacen("{}", &task.name, 1)
                    .replacen("{}", p_id, 1),
            ));
        }
    }

    let resolved_task_id = resolved_task.map(|t| t.id);

    let filter = ElapsedRangeFilter {
        project_id: resolved_project_id,
        task_id: resolved_task_id,
        from: from_iso,
        to: to_iso,
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
        period: period_label,
        total_seconds: total_secs,
        total_formatted: format_duration(total_secs),
        projects: project_dtos,
    })
}

fn determine_bounds(
    criteria: &ReportFilterCriteria,
) -> Result<(Option<String>, Option<String>, String), CliError> {
    if criteria.from.is_some() || criteria.to.is_some() {
        return parse_custom_range_bounds(criteria.from.as_deref(), criteria.to.as_deref());
    }

    let now = Utc::now();
    if criteria.today {
        let midnight = now
            .date_naive()
            .and_hms_opt(0, 0, 0)
            .map(|ndt| ndt.and_utc())
            .unwrap_or(now);
        return Ok((
            Some(midnight.to_rfc3339()),
            None,
            PERIOD_LABEL_TODAY.to_string(),
        ));
    }
    if criteria.week {
        let days = now.weekday().num_days_from_monday();
        let monday = (now - chrono::Duration::days(days as i64))
            .date_naive()
            .and_hms_opt(0, 0, 0)
            .map(|ndt| ndt.and_utc())
            .unwrap_or(now);
        return Ok((
            Some(monday.to_rfc3339()),
            None,
            PERIOD_LABEL_WEEK.to_string(),
        ));
    }
    if criteria.month {
        let first = chrono::NaiveDate::from_ymd_opt(now.year(), now.month(), 1)
            .and_then(|d| d.and_hms_opt(0, 0, 0))
            .map(|ndt| ndt.and_utc())
            .unwrap_or(now);
        return Ok((
            Some(first.to_rfc3339()),
            None,
            PERIOD_LABEL_MONTH.to_string(),
        ));
    }

    Ok((None, None, PERIOD_LABEL_ALL.to_string()))
}

fn parse_custom_range_bounds(
    from: Option<&str>,
    to: Option<&str>,
) -> Result<(Option<String>, Option<String>, String), CliError> {
    let from_dt = from.map(|s| parse_date_bound(s, false)).transpose()?;
    let to_dt = to.map(|s| parse_date_bound(s, true)).transpose()?;

    if let (Some(f), Some(t)) = (from_dt, to_dt) {
        if f > t {
            return Err(CliError::business_custom(ERR_DATE_RANGE_INVALID));
        }
    }

    let label = format_range_label(from, to);
    Ok((
        from_dt.map(|dt| dt.to_rfc3339()),
        to_dt.map(|dt| dt.to_rfc3339()),
        label,
    ))
}

fn format_range_label(from: Option<&str>, to: Option<&str>) -> String {
    match (from, to) {
        (Some(f), Some(t)) => format!("{} to {}", f, t),
        (Some(f), None) => format!("From {}", f),
        (None, Some(t)) => format!("Until {}", t),
        (None, None) => PERIOD_LABEL_CUSTOM.to_string(),
    }
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
