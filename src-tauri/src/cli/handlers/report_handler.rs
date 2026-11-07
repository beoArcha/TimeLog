use super::constants::ERR_TASK_NOT_IN_PROJECT;
use super::report_bounds::determine_bounds;
use super::report_dto_builder::{build_entry_dtos, build_project_dto};
use super::report_schema_handler;
use crate::cli::error::CliError;
use crate::cli::exporters::constants::MSG_EXPORT_SUCCESS;
use crate::cli::exporters::export_to_file;
use crate::cli::formatters::{
    format_duration, render_tree_string, ReportProjectDto, ReportTreeDto,
};
use crate::cli::parser::{ReportArgs, ReportSubcommand};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{ElapsedRangeFilter, Project, Task};
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
    if let Some(ReportSubcommand::Schema { output, version }) = args.command {
        return report_schema_handler::handle(output, &version, is_machine);
    }

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
        Some(ReportSubcommand::Schema { .. }) => ReportFilterCriteria::default(),
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
        project_ids: None,
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

    let task_map: HashMap<String, Task> = all_tasks
        .iter()
        .map(|t| (t.id.clone(), t.clone()))
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
    let entry_dtos = build_entry_dtos(&metrics.clamped_logs, &project_map, &task_map);

    Ok(ReportTreeDto {
        period: period_label,
        total_seconds: total_secs,
        total_formatted: format_duration(total_secs),
        projects: project_dtos,
        entries: entry_dtos,
    })
}
