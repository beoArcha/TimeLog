use super::constants::{MSG_TASK_ARCHIVED, MSG_TASK_CREATED, MSG_TASK_RENAMED};
use crate::cli::error::CliError;
use crate::cli::resolver::{EntityType, ResolveError};
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::{current_timestamp, generate_id};
use crate::persistence::Persistence;
use crate::types::Task;
use clap::Subcommand;

#[derive(Debug, Clone, Subcommand)]
pub enum TaskCommand {
    Create {
        #[arg(short, long)]
        project_id: String,
        name: String,
    },
    Archive {
        id: String,
        #[arg(short, long)]
        project_id: String,
    },
    Rename {
        id: String,
        name: String,
    },
}

pub fn handle(cmd: TaskCommand, persistence: &Persistence) -> Result<CliOutput, CliError> {
    match cmd {
        TaskCommand::Create { project_id, name } => create_task(persistence, project_id, name),
        TaskCommand::Archive { id, project_id } => archive_task(persistence, id, project_id),
        TaskCommand::Rename { id, name } => rename_task(persistence, id, name),
    }
}

fn create_task(
    persistence: &Persistence,
    project_id: String,
    name: String,
) -> Result<CliOutput, CliError> {
    let id = generate_id();
    let task = Task {
        id: id.clone(),
        project_id,
        parent_task_id: None,
        name: name.clone(),
        created_at: current_timestamp(),
        completed: false,
        original_name: Some(name),
        original_completed: Some(false),
        edit_history: Some(vec![]),
        archived: Some(false),
        status: Some(crate::types::TaskStatus::Todo),
    };

    persistence
        .tasks
        .create(task)
        .map_err(|e| CliError::Storage(e.to_string()))?;
    Ok(CliOutput::Success(MSG_TASK_CREATED.replace("{}", &id)))
}

fn archive_task(
    persistence: &Persistence,
    id: String,
    project_id: String,
) -> Result<CliOutput, CliError> {
    let _ = persistence
        .tasks
        .get(&id)
        .map_err(|e| CliError::Storage(e.to_string()))?
        .ok_or_else(|| {
            CliError::Entity(ResolveError::NotFound {
                target: id.clone(),
                entity_type: EntityType::Task,
            })
        })?;

    persistence
        .tasks
        .archive(id.clone(), project_id)
        .map_err(|e| CliError::Storage(e.to_string()))?;
    Ok(CliOutput::Success(MSG_TASK_ARCHIVED.replace("{}", &id)))
}

fn rename_task(persistence: &Persistence, id: String, name: String) -> Result<CliOutput, CliError> {
    let mut task = persistence
        .tasks
        .get(&id)
        .map_err(|e| CliError::Storage(e.to_string()))?
        .ok_or_else(|| {
            CliError::Entity(ResolveError::NotFound {
                target: id.clone(),
                entity_type: EntityType::Task,
            })
        })?;

    task.name = name;
    persistence
        .tasks
        .patch(task)
        .map_err(|e| CliError::Storage(e.to_string()))?;
    Ok(CliOutput::Success(MSG_TASK_RENAMED.replace("{}", &id)))
}
