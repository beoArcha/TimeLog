use super::constants::{
    FORMAT_PROJECT_ROW, HEADER_PROJECTS, LABEL_ARCHIVED_BADGE, MSG_NO_PROJECTS_FOUND,
    MSG_PROJECT_ARCHIVED, MSG_PROJECT_CREATED, MSG_PROJECT_RENAMED,
};
use crate::cli::error::CliError;
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
        ProjectSubcommand::Add { name, color } => add_project(persistence, name, color, is_machine),
        ProjectSubcommand::Rename { target, new_name } => {
            rename_project(persistence, &target, new_name, is_machine)
        }
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
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    let engine = Engine::new(persistence);
    let valid_name = engine.validate_project_name(&name, None)?;
    let id = generate_id();
    let project = Project::new(
        id.clone(),
        valid_name,
        color.unwrap_or_else(|| DEFAULT_COLOR.to_string()),
        None,
        None,
        None,
        None,
    );
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
    new_name: String,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    let resolver = EntityResolver::with_mode(persistence, is_machine);
    let mut project = resolver.resolve_project(target)?;
    let engine = Engine::new(persistence);
    project.name = engine.validate_project_name(&new_name, Some(&project.id))?;
    persistence.projects.patch(project.clone())?;
    if is_machine {
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": project.id,
                "action": "renamed"
            })
            .to_string(),
        ));
    }
    Ok(CliOutput::Success(
        MSG_PROJECT_RENAMED.replace("{}", &project.id),
    ))
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
