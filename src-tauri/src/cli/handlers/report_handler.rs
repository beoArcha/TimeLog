use super::constants::{
    ERR_TASK_NOT_IN_PROJECT, PERIOD_LABEL_ALL, PERIOD_LABEL_CUSTOM, PERIOD_LABEL_LAST_MONTH,
    PERIOD_LABEL_LAST_WEEK, PERIOD_LABEL_MONTH, PERIOD_LABEL_TEMPLATE, PERIOD_LABEL_TODAY,
    PERIOD_LABEL_WEEK, PERIOD_LABEL_YESTERDAY,
};
use super::report_dto_builder::{build_entry_dtos, build_project_dto};
use super::report_schema_handler;
use crate::cli::error::CliError;
use crate::cli::exporters::constants::MSG_EXPORT_SUCCESS;
use crate::cli::exporters::export_to_file;
use crate::cli::formatters::{
    format_duration, render_tree_string, ReportProjectDto, ReportTreeDto,
};
use crate::cli::parser::{PeriodArgs, ReportArgs, ReportSubcommand};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{ElapsedRangeFilter, Project, RangePreset, ResolvedRange, Task};
use std::collections::HashMap;

#[derive(Debug, Clone, Default)]
pub struct ReportFilterCriteria {
    pub period: PeriodArgs,
    pub project: Option<String>,
    pub task: Option<String>,
}

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

pub fn handle(
    args: ReportArgs,
    is_machine: bool,
    strict: bool,
    persistence: &Persistence,
    engine: &Engine,
    tz: Option<&str>,
) -> Result<CliOutput, CliError> {
    if let Some(ReportSubcommand::Schema { output, version }) = args.command.as_ref() {
        return report_schema_handler::handle(output.clone(), version, is_machine);
    }

    let criteria = extract_filter_criteria(&args);

    if let Some(ReportSubcommand::Export { format, output, .. }) = args.command {
        let tree = build_report_tree(&criteria, strict, persistence, engine, tz)?;
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

    let tree = build_report_tree(&criteria, strict, persistence, engine, tz)?;
    render_tree_output(&tree, is_machine)
}

fn extract_filter_criteria(args: &ReportArgs) -> ReportFilterCriteria {
    match &args.command {
        Some(
            ReportSubcommand::Export {
                period,
                project,
                task,
                ..
            }
            | ReportSubcommand::Tree {
                period,
                project,
                task,
            },
        ) => ReportFilterCriteria {
            period: period.clone().or(args.period.clone()),
            project: project.clone().or_else(|| args.project.clone()),
            task: task.clone().or_else(|| args.task.clone()),
        },
        Some(ReportSubcommand::Schema { .. }) => ReportFilterCriteria::default(),
        None => ReportFilterCriteria {
            period: args.period.clone(),
            project: args.project.clone(),
            task: args.task.clone(),
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
    strict: bool,
    persistence: &Persistence,
    engine: &Engine,
    tz: Option<&str>,
) -> Result<ReportTreeDto, CliError> {
    let range_request = criteria.period.to_range_request(tz);
    let resolved = engine.resolve_range(&range_request)?;
    let period_label = format_period_label(&resolved);

    let resolved_project_id = match &criteria.project {
        Some(target) => {
            let resolver = EntityResolver::with_mode(persistence, strict);
            let p = resolver.resolve_project(target)?;
            Some(p.id)
        }
        None => None,
    };

    let resolved_task = match &criteria.task {
        Some(target) => {
            let resolver = EntityResolver::with_mode(persistence, strict);
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
        from: resolved.from,
        to: resolved.to,
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
