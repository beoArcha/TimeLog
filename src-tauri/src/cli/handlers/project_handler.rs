use crate::cli::parser::tier2_entities::{ProjectArgs, ProjectSubcommand};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::constants::{
    DEFAULT_COLOR, FORMAT_PROJECT_ROW, HEADER_PROJECTS, LABEL_ARCHIVED_BADGE,
    MSG_NO_PROJECTS_FOUND, MSG_PROJECT_ARCHIVED, MSG_PROJECT_CREATED, MSG_PROJECT_RENAMED,
};
use crate::cli::error::CliError;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::{current_timestamp, generate_id};
use crate::persistence::Persistence;
use crate::types::Project;

pub fn handle(args: ProjectArgs, persistence: &Persistence) -> Result<CliOutput, CliError> {
    match args.command {
        ProjectSubcommand::List { all } => list_projects(persistence, all),
        ProjectSubcommand::Add { name, color } => add_project(persistence, name, color),
        ProjectSubcommand::Rename { target, new_name } => {
            rename_project(persistence, &target, new_name)
        }
        ProjectSubcommand::Archive { target } => archive_project(persistence, &target),
    }
}

fn list_projects(persistence: &Persistence, all: bool) -> Result<CliOutput, CliError> {
    let projects = persistence
        .projects
        .get_all()
        .map_err(|e| CliError::Storage(e.to_string()))?;
    let tasks = persistence.tasks.get_all().unwrap_or_default();

    let filtered: Vec<_> = projects
        .into_iter()
        .filter(|p| all || p.archived != Some(true))
        .collect();

    if filtered.is_empty() {
        return Ok(CliOutput::Success(MSG_NO_PROJECTS_FOUND.to_string()));
    }

    Ok(CliOutput::Success(format_project_list(&filtered, &tasks)))
}

fn format_project_list(projects: &[Project], tasks: &[crate::types::Task]) -> String {
    let mut out = String::from(HEADER_PROJECTS);
    for p in projects {
        let task_count = tasks.iter().filter(|t| t.project_id == p.id).count();
        let archived_badge = if p.archived == Some(true) {
            LABEL_ARCHIVED_BADGE
        } else {
            ""
        };
        out.push_str(
            &FORMAT_PROJECT_ROW
                .replacen("{}", &p.name, 1)
                .replacen("{}", &p.id, 1)
                .replacen("{}", &p.color, 1)
                .replacen("{}", &task_count.to_string(), 1)
                .replacen("{}", archived_badge, 1),
        );
    }
    out
}

fn add_project(
    persistence: &Persistence,
    name: String,
    color: Option<String>,
) -> Result<CliOutput, CliError> {
    let id = generate_id();
    let project = Project {
        id: id.clone(),
        name: name.clone(),
        color: color.unwrap_or_else(|| DEFAULT_COLOR.to_string()),
        created_at: current_timestamp(),
        archived: Some(false),
        original_name: Some(name),
        original_color: None,
        edit_history: Some(vec![]),
        description: None,
        icon: None,
        tags: None,
    };
    persistence
        .projects
        .create(project)
        .map_err(|e| CliError::Storage(e.to_string()))?;
    Ok(CliOutput::Success(MSG_PROJECT_CREATED.replace("{}", &id)))
}

fn rename_project(
    persistence: &Persistence,
    target: &str,
    new_name: String,
) -> Result<CliOutput, CliError> {
    let resolver = EntityResolver::new(persistence);
    let mut project = resolver.resolve_project(target)?;
    project.name = new_name;
    persistence
        .projects
        .patch(project.clone())
        .map_err(|e| CliError::Storage(e.to_string()))?;
    Ok(CliOutput::Success(
        MSG_PROJECT_RENAMED.replace("{}", &project.id),
    ))
}

fn archive_project(persistence: &Persistence, target: &str) -> Result<CliOutput, CliError> {
    let resolver = EntityResolver::new(persistence);
    let project = resolver.resolve_project(target)?;
    persistence
        .projects
        .archive(project.id.clone())
        .map_err(|e| CliError::Storage(e.to_string()))?;
    Ok(CliOutput::Success(
        MSG_PROJECT_ARCHIVED.replace("{}", &project.id),
    ))
}
