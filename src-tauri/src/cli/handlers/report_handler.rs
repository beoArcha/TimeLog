use super::constants::ERR_TASK_NOT_IN_PROJECT;
use super::report_delivery::{deliver, ReportDelivery};
use super::report_schema_handler;
use crate::cli::error::CliError;
use crate::cli::parser::{PeriodArgs, ReportArgs, ReportSubcommand};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{ReportDocument, ReportRequest, ReportVariant};

#[derive(Debug, Clone, Default)]
pub struct ReportFilterCriteria {
    pub period: PeriodArgs,
    pub project: Option<String>,
    pub task: Option<String>,
}

impl From<&ReportArgs> for ReportFilterCriteria {
    fn from(args: &ReportArgs) -> Self {
        Self {
            period: args.period.clone(),
            project: args.project.clone(),
            task: args.task.clone(),
        }
    }
}

pub fn handle(
    args: ReportArgs,
    is_machine: bool,
    is_quiet: bool,
    strict: bool,
    persistence: &Persistence,
    engine: &Engine,
    tz: Option<&str>,
) -> Result<CliOutput, CliError> {
    if let Some(ReportSubcommand::Schema {
        output,
        format,
        target,
    }) = args.command.as_ref()
    {
        return report_schema_handler::handle(output.as_deref(), *format, *target, is_machine);
    }

    let delivery = ReportDelivery::plan(&args, is_machine, is_quiet)?;
    let criteria = ReportFilterCriteria::from(&args);
    let document = build_report_document(
        &criteria,
        args.variant.into(),
        strict,
        persistence,
        engine,
        tz,
    )?;
    deliver(&document, &delivery)
}

pub fn build_report_document(
    criteria: &ReportFilterCriteria,
    variant: ReportVariant,
    strict: bool,
    persistence: &Persistence,
    engine: &Engine,
    tz: Option<&str>,
) -> Result<ReportDocument, CliError> {
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
        variant,
        include_patches: Some(true),
    };

    Ok(engine.build_report(&request)?)
}
