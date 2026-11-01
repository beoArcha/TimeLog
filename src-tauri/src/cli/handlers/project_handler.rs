use super::billing_input::{
    BillingValueAction, NormalizedBillingCreation, NormalizedBillingUpdate,
};
use super::constants::{
    ERR_PROJECT_RENAME_EMPTY, FORMAT_PROJECT_ROW, HEADER_PROJECTS, LABEL_ARCHIVED_BADGE,
    MSG_NO_PROJECTS_FOUND, MSG_PROJECT_ARCHIVED, MSG_PROJECT_CREATED, MSG_PROJECT_RENAMED,
    MSG_PROJECT_UPDATED,
};
use crate::cli::error::{CliError, CliSyntaxError};
use crate::cli::parser::tier2_entities::{ProjectArgs, ProjectSubcommand};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::constants::DEFAULT_COLOR;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::generate_id;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{Project, Task};

pub struct RenameProjectOptions {
    pub target: String,
    pub new_name: Option<String>,
    pub color: Option<String>,
    pub rate: Option<String>,
    pub rate_cents: Option<u64>,
    pub currency: Option<String>,
    pub is_machine: bool,
}

pub fn handle(
    args: ProjectArgs,
    is_machine: bool,
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
            name,
            color,
            rate,
            rate_cents,
            currency,
            is_machine,
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
            },
        ),
        ProjectSubcommand::Archive { target } => archive_project(persistence, &target, is_machine),
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
        let json = serde_json::to_string_pretty(&filtered)?;
        return Ok(CliOutput::Json(json));
    }

    if filtered.is_empty() {
        return Ok(CliOutput::Success(MSG_NO_PROJECTS_FOUND.to_string()));
    }

    Ok(CliOutput::Success(format_project_list(
        &filtered, &tasks, is_quiet,
    )))
}

fn format_project_list(projects: &[Project], tasks: &[Task], is_quiet: bool) -> String {
    let rows: String = projects
        .iter()
        .map(|p| format_project_row(p, tasks))
        .collect();
    if is_quiet {
        rows.trim_end().to_string()
    } else {
        format!("{}{}", HEADER_PROJECTS, rows)
    }
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
    name: String,
    color: Option<String>,
    rate: Option<String>,
    rate_cents: Option<u64>,
    currency: Option<String>,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
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
    persistence.projects.create(project)?;
    if is_machine {
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": id,
                "action": "created"
            })
            .to_string(),
        ));
    }
    Ok(CliOutput::Success(MSG_PROJECT_CREATED.replace("{}", &id)))
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

    let resolver = EntityResolver::with_mode(persistence, opts.is_machine);
    let mut project = resolver.resolve_project(&opts.target)?;

    let has_new_name = opts.new_name.is_some();
    let has_color = opts.color.is_some();
    let has_rate = billing_update.rate != BillingValueAction::Unchanged;
    let has_currency = billing_update.currency != BillingValueAction::Unchanged;

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
        let action = if has_new_name {
            "renamed"
        } else if has_color && !has_rate && !has_currency {
            "recolored"
        } else {
            "updated"
        };
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": project.id,
                "name": project.name,
                "color": project.color,
                "hourly_rate": project.hourly_rate,
                "billing_rate_cents": project.billing_rate_cents,
                "currency": project.currency,
                "billing_currency": project.billing_currency,
                "action": action
            })
            .to_string(),
        ));
    }

    let msg = if has_new_name {
        MSG_PROJECT_RENAMED.replace("{}", &project.id)
    } else {
        MSG_PROJECT_UPDATED.replace("{}", &project.id)
    };
    Ok(CliOutput::Success(msg))
}

fn archive_project(
    persistence: &Persistence,
    target: &str,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    let resolver = EntityResolver::with_mode(persistence, is_machine);
    let project = resolver.resolve_project(target)?;
    persistence.projects.archive(project.id.clone())?;
    if is_machine {
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": project.id,
                "action": "archived"
            })
            .to_string(),
        ));
    }
    Ok(CliOutput::Success(
        MSG_PROJECT_ARCHIVED.replace("{}", &project.id),
    ))
}
