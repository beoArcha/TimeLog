use super::billing_input::{NormalizedBillingCreation, NormalizedBillingUpdate};
use super::constants::{
    ERR_PROJECT_RENAME_EMPTY, FORMAT_PROJECT_ROW, HEADER_PROJECTS, LABEL_ARCHIVED_BADGE,
    MSG_NO_PROJECTS_FOUND, MSG_PROJECT_ARCHIVED, MSG_PROJECT_CREATED, MSG_PROJECT_RENAMED,
    MSG_PROJECT_UPDATED,
};
use crate::cli::error::{CliError, CliSyntaxError};
use crate::cli::parser::tier2_entities::{ProjectArgs, ProjectSubcommand};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::constants::DEFAULT_COLOR;
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::generate_id;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{EntityActionPayload, Project, ProjectListPayload, Task};

const SCHEMA_PROJECT_LIST: EnvelopeSchema = EnvelopeSchema::new("oxy.project.list", 1);
const SCHEMA_PROJECT_ADD: EnvelopeSchema = EnvelopeSchema::new("oxy.project.add", 1);
const SCHEMA_PROJECT_RENAME: EnvelopeSchema = EnvelopeSchema::new("oxy.project.rename", 1);
const SCHEMA_PROJECT_ARCHIVE: EnvelopeSchema = EnvelopeSchema::new("oxy.project.archive", 1);

pub struct AddProjectOptions {
    pub name: String,
    pub color: Option<String>,
    pub rate: Option<String>,
    pub rate_cents: Option<u64>,
    pub currency: Option<String>,
}

pub struct RenameProjectOptions {
    pub target: String,
    pub new_name: Option<String>,
    pub color: Option<String>,
    pub rate: Option<String>,
    pub rate_cents: Option<u64>,
    pub currency: Option<String>,
    pub is_machine: bool,
    pub is_quiet: bool,
    pub strict: bool,
}

pub fn handle(
    args: ProjectArgs,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    match args.command {
        ProjectSubcommand::List { all } => list_projects(persistence, all, is_machine, is_quiet),
        ProjectSubcommand::Add {
            name,
            color,
            rate,
            rate_cents,
            currency,
        } => add_project(
            persistence,
            AddProjectOptions {
                name,
                color,
                rate,
                rate_cents,
                currency,
            },
            is_machine,
            is_quiet,
        ),
        ProjectSubcommand::Rename {
            target,
            new_name,
            color,
            rate,
            rate_cents,
            currency,
        } => rename_project(
            persistence,
            RenameProjectOptions {
                target,
                new_name,
                color,
                rate,
                rate_cents,
                currency,
                is_machine,
                is_quiet,
                strict,
            },
        ),
        ProjectSubcommand::Archive { target } => {
            archive_project(persistence, &target, is_machine, strict, is_quiet)
        }
    }
}

fn list_projects(
    persistence: &Persistence,
    all: bool,
    is_machine: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    let projects = persistence.projects.get_all()?;
    let tasks = persistence.tasks.get_all()?;

    let filtered: Vec<_> = projects
        .into_iter()
        .filter(|p| all || p.archived != Some(true))
        .collect();

    if is_machine {
        return CliOutput::envelope(SCHEMA_PROJECT_LIST, &ProjectListPayload { items: filtered });
    }

    if filtered.is_empty() {
        return Ok(CliOutput::empty_list(is_quiet, MSG_NO_PROJECTS_FOUND));
    }

    let rows = format_project_rows(&filtered, &tasks);
    Ok(CliOutput::list(is_quiet, HEADER_PROJECTS, &rows))
}

fn format_project_rows(projects: &[Project], tasks: &[Task]) -> String {
    projects
        .iter()
        .map(|p| format_project_row(p, tasks))
        .collect()
}

fn format_project_row(project: &Project, tasks: &[Task]) -> String {
    let task_count = tasks.iter().filter(|t| t.project_id == project.id).count();
    let archived_badge = project
        .archived
        .filter(|&is_archived| is_archived)
        .map(|_| LABEL_ARCHIVED_BADGE)
        .unwrap_or("");

    FORMAT_PROJECT_ROW
        .replacen("{}", &project.name, 1)
        .replacen("{}", &project.id, 1)
        .replacen("{}", &project.color, 1)
        .replacen("{}", &task_count.to_string(), 1)
        .replacen("{}", archived_badge, 1)
}

fn add_project(
    persistence: &Persistence,
    opts: AddProjectOptions,
    is_machine: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    let AddProjectOptions {
        name,
        color,
        rate,
        rate_cents,
        currency,
    } = opts;
    let billing = NormalizedBillingCreation::parse(rate, rate_cents, currency)?;
    let engine = Engine::new(persistence);
    let valid_name = engine.validate_project_name(&name, None)?;
    let id = generate_id();
    let mut project = Project::new(
        id.clone(),
        valid_name,
        color.unwrap_or_else(|| DEFAULT_COLOR.to_string()),
        None,
        None,
        None,
        None,
    );
    project.hourly_rate = billing.hourly_rate;
    project.billing_rate_cents = billing.billing_rate_cents;
    project.currency = billing.currency;
    project.billing_currency = billing.billing_currency;
    persistence.projects.create(project.clone())?;
    if is_machine {
        return CliOutput::envelope(SCHEMA_PROJECT_ADD, &project);
    }
    Ok(CliOutput::mutation(
        is_quiet,
        &id,
        MSG_PROJECT_CREATED.replace("{}", &id),
    ))
}

fn rename_project(
    persistence: &Persistence,
    opts: RenameProjectOptions,
) -> Result<CliOutput, CliError> {
    if opts.new_name.is_none()
        && opts.color.is_none()
        && opts.rate.is_none()
        && opts.rate_cents.is_none()
        && opts.currency.is_none()
    {
        return Err(CliError::Syntax(CliSyntaxError::InvalidArgs(
            ERR_PROJECT_RENAME_EMPTY.to_string(),
        )));
    }

    let billing_update = NormalizedBillingUpdate::parse(opts.rate, opts.rate_cents, opts.currency)?;

    let resolver = EntityResolver::with_mode(persistence, opts.strict);
    let mut project = resolver.resolve_project(&opts.target)?;

    let has_new_name = opts.new_name.is_some();

    if let Some(ref name) = opts.new_name {
        let engine = Engine::new(persistence);
        project.name = engine.validate_project_name(name, Some(&project.id))?;
    }
    if let Some(c) = opts.color {
        project.color = c;
    }
    billing_update.apply_to_project(&mut project);

    persistence.projects.patch(project.clone())?;

    if opts.is_machine {
        return CliOutput::envelope(SCHEMA_PROJECT_RENAME, &project);
    }

    let msg = if has_new_name {
        MSG_PROJECT_RENAMED.replace("{}", &project.id)
    } else {
        MSG_PROJECT_UPDATED.replace("{}", &project.id)
    };
    Ok(CliOutput::mutation(opts.is_quiet, &project.id, msg))
}

fn archive_project(
    persistence: &Persistence,
    target: &str,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    let resolver = EntityResolver::with_mode(persistence, strict);
    let project = resolver.resolve_project(target)?;
    persistence.projects.archive(project.id.clone())?;
    if is_machine {
        return CliOutput::envelope(
            SCHEMA_PROJECT_ARCHIVE,
            &EntityActionPayload {
                id: project.id,
                action: "archived".to_string(),
            },
        );
    }
    Ok(CliOutput::mutation(
        is_quiet,
        &project.id,
        MSG_PROJECT_ARCHIVED.replace("{}", &project.id),
    ))
}
