use super::constants::{
    FORMAT_SUBTASK_ITEM, MSG_NO_SUBTASKS_FOUND, MSG_SUBTASKS_HEADER, MSG_SUBTASK_ARCHIVED,
    MSG_SUBTASK_CREATED, SYMBOL_SUBTASK_CHECKED, SYMBOL_SUBTASK_UNCHECKED,
};
use crate::cli::error::CliError;
use crate::cli::resolver::{EntityType, ResolveError};
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::{current_timestamp, generate_id};
use crate::persistence::Persistence;
use crate::types::Task;
use clap::Subcommand;

#[derive(Debug, Clone, Subcommand)]
pub enum SubtaskCommand {
    Create {
        #[arg(short, long)]
        task_id: String,
        name: String,
    },
    Archive {
        id: String,
        #[arg(short, long)]
        task_id: String,
    },
    List {
        task_id: String,
    },
}

pub fn handle(cmd: SubtaskCommand, persistence: &Persistence) -> Result<CliOutput, CliError> {
    match cmd {
        SubtaskCommand::Create { task_id, name } => create_subtask(persistence, task_id, name),
        SubtaskCommand::Archive { id, task_id } => archive_subtask(persistence, id, task_id),
        SubtaskCommand::List { task_id } => list_subtasks(persistence, task_id),
    }
}

fn create_subtask(
    persistence: &Persistence,
    task_id: String,
    name: String,
) -> Result<CliOutput, CliError> {
    let parent = persistence
        .tasks
        .get(&task_id)
        .map_err(|e| CliError::Storage(e.to_string()))?
        .ok_or_else(|| {
            CliError::Entity(ResolveError::NotFound {
                target: task_id.clone(),
                entity_type: EntityType::Task,
            })
        })?;

    let id = generate_id();
    let subtask = Task {
        id: id.clone(),
        project_id: parent.project_id,
        parent_task_id: Some(task_id),
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
        .create_subtask(subtask)
        .map_err(|e| CliError::Storage(e.to_string()))?;

    Ok(CliOutput::Success(MSG_SUBTASK_CREATED.replace("{}", &id)))
}

fn archive_subtask(
    persistence: &Persistence,
    id: String,
    task_id: String,
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
        .archive_subtask(id.clone(), task_id)
        .map_err(|e| CliError::Storage(e.to_string()))?;

    Ok(CliOutput::Success(MSG_SUBTASK_ARCHIVED.replace("{}", &id)))
}

fn list_subtasks(persistence: &Persistence, task_id: String) -> Result<CliOutput, CliError> {
    let _parent = persistence
        .tasks
        .get(&task_id)
        .map_err(|e| CliError::Storage(e.to_string()))?
        .ok_or_else(|| {
            CliError::Entity(ResolveError::NotFound {
                target: task_id.clone(),
                entity_type: EntityType::Task,
            })
        })?;

    let subtasks = persistence
        .tasks
        .get_subtasks(&task_id)
        .map_err(|e| CliError::Storage(e.to_string()))?;

    if subtasks.is_empty() {
        return Ok(CliOutput::Success(
            MSG_NO_SUBTASKS_FOUND.replace("{}", &task_id),
        ));
    }

    let mut lines = vec![MSG_SUBTASKS_HEADER.replace("{}", &task_id)];
    for st in subtasks {
        let mark = if st.completed {
            SYMBOL_SUBTASK_CHECKED
        } else {
            SYMBOL_SUBTASK_UNCHECKED
        };
        lines.push(
            FORMAT_SUBTASK_ITEM
                .replacen("{}", mark, 1)
                .replacen("{}", &st.name, 1)
                .replacen("{}", &st.id, 1),
        );
    }
    Ok(CliOutput::Success(lines.join("\n")))
}
