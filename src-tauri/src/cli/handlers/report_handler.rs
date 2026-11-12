use super::constants::ERR_TASK_NOT_IN_PROJECT;
pub use super::report_adapter::format_period_label;
use super::report_adapter::to_report_tree_dto;
use super::report_schema_handler;
use crate::cli::error::CliError;
use crate::cli::exporters::constants::MSG_EXPORT_SUCCESS;
use crate::cli::exporters::export_to_file;
use crate::cli::formatters::{render_tree_string, ReportTreeDto};
use crate::cli::parser::{PeriodArgs, ReportArgs, ReportSubcommand};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{ReportRequest, ReportVariant};

#[derive(Debug, Clone, Default)]
pub struct ReportFilterCriteria {
    pub period: PeriodArgs,
    pub project: Option<String>,
    pub task: Option<String>,
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
    let tree = build_report_tree(&criteria, strict, persistence, engine, tz)?;

    if let Some(ReportSubcommand::Export { format, output, .. }) = args.command {
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
    let resolver = EntityResolver::with_mode(persistence, strict);
    let project_id = criteria
        .project
        .as_deref()
        .map(|name| resolver.resolve_project(name).map(|p| p.id))
        .transpose()?;

    let task = criteria
        .task
        .as_deref()
        .map(|name| resolver.resolve_task(name))
        .transpose()?;

    if let (Some(ref p_id), Some(ref task)) = (&project_id, &task) {
        if &task.project_id != p_id {
            return Err(CliError::business_custom(
                ERR_TASK_NOT_IN_PROJECT
                    .replacen("{}", &task.name, 1)
                    .replacen("{}", p_id, 1),
            ));
        }
    }

    let request = ReportRequest {
        range: criteria.period.to_range_request(tz),
        project_id,
        task_id: task.map(|t| t.id),
        variant: ReportVariant::Full,
        include_patches: Some(true),
    };

    let doc = engine.build_report(&request)?;
    Ok(to_report_tree_dto(&doc))
}
