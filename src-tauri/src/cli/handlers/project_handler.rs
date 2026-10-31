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
            currency,
        } => add_project(persistence, name, color, rate, currency, is_machine),
        ProjectSubcommand::Rename {
            target,
            new_name,
            color,
            rate,
            currency,
        } => rename_project(persistence, &target, new_name, color, rate, currency, is_machine),
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
    currency: Option<String>,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
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
    project.hourly_rate = rate;
    project.currency = currency;
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
    target: &str,
    new_name: Option<String>,
    color: Option<String>,
    rate: Option<String>,
    currency: Option<String>,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    if new_name.is_none() && color.is_none() && rate.is_none() && currency.is_none() {
        return Err(CliError::Syntax(CliSyntaxError::InvalidArgs(
            ERR_PROJECT_RENAME_EMPTY.to_string(),
        )));
    }

    let resolver = EntityResolver::with_mode(persistence, is_machine);
    let mut project = resolver.resolve_project(target)?;

    let has_new_name = new_name.is_some();
    if let Some(ref name) = new_name {
        let engine = Engine::new(persistence);
        project.name = engine.validate_project_name(name, Some(&project.id))?;
    }
    if let Some(c) = color {
        project.color = c;
    }
    if let Some(r) = rate {
        project.hourly_rate = if r.eq_ignore_ascii_case("none") || r.eq_ignore_ascii_case("clear") {
            None
        } else {
            Some(r)
        };
    }
    if let Some(curr) = currency {
        project.currency = if curr.eq_ignore_ascii_case("none") || curr.eq_ignore_ascii_case("clear") {
            None
        } else {
            Some(curr)
        };
    }

    persistence.projects.patch(project.clone())?;

    if is_machine {
        let action = if has_new_name { "renamed" } else { "recolored" };
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": project.id,
                "name": project.name,
                "color": project.color,
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
