use super::constants::{MSG_PROJECT_ARCHIVED, MSG_PROJECT_CREATED, MSG_PROJECT_RENAMED};
use crate::cli::error::CliError;
use crate::cli::resolver::{EntityType, ResolveError};
use crate::cli::shared::constants::{DEFAULT_COLOR, MSG_LIST_NOT_IMPLEMENTED};
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::{current_timestamp, generate_id};
use crate::persistence::Persistence;
use crate::types::Project;
use clap::Subcommand;

#[derive(Debug, Clone, Subcommand)]
pub enum ProjectCommand {
    Create {
        name: String,
        #[arg(short, long)]
        color: Option<String>,
    },
    List,
    Archive {
        id: String,
    },
    Rename {
        id: String,
        name: String,
    },
}

pub fn handle(cmd: ProjectCommand, persistence: &Persistence) -> Result<CliOutput, CliError> {
    match cmd {
        ProjectCommand::Create { name, color } => create_project(persistence, name, color),
        ProjectCommand::List => list_projects(),
        ProjectCommand::Archive { id } => archive_project(persistence, id),
        ProjectCommand::Rename { id, name } => rename_project(persistence, id, name),
    }
}

fn create_project(
    persistence: &Persistence,
    name: String,
    color: Option<String>,
) -> Result<CliOutput, CliError> {
    let id = generate_id();
    let project = Project {
        id: id.clone(),
        name: name.clone(),
        color: color.clone().unwrap_or_else(|| DEFAULT_COLOR.to_string()),
        created_at: current_timestamp(),
        archived: Some(false),
        original_name: Some(name),
        original_color: color,
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

fn list_projects() -> Result<CliOutput, CliError> {
    Ok(CliOutput::Success(MSG_LIST_NOT_IMPLEMENTED.to_string()))
}

fn archive_project(persistence: &Persistence, id: String) -> Result<CliOutput, CliError> {
    let _ = persistence
        .projects
        .get(&id)
        .map_err(|e| CliError::Storage(e.to_string()))?
        .ok_or_else(|| {
            CliError::Entity(ResolveError::NotFound {
                target: id.clone(),
                entity_type: EntityType::Project,
            })
        })?;

    persistence
        .projects
        .archive(id.clone())
        .map_err(|e| CliError::Storage(e.to_string()))?;

    Ok(CliOutput::Success(MSG_PROJECT_ARCHIVED.replace("{}", &id)))
}

fn rename_project(
    persistence: &Persistence,
    id: String,
    name: String,
) -> Result<CliOutput, CliError> {
    let mut project = persistence
        .projects
        .get(&id)
        .map_err(|e| CliError::Storage(e.to_string()))?
        .ok_or_else(|| {
            CliError::Entity(ResolveError::NotFound {
                target: id.clone(),
                entity_type: EntityType::Project,
            })
        })?;

    project.name = name;
    persistence
        .projects
        .patch(project)
        .map_err(|e| CliError::Storage(e.to_string()))?;

    Ok(CliOutput::Success(MSG_PROJECT_RENAMED.replace("{}", &id)))
}
