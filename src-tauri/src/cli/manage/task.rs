use crate::cli::shared::constants::{
    MSG_TASK_ARCHIVED, MSG_TASK_CREATED, MSG_TASK_NOT_FOUND, MSG_TASK_RENAMED,
};
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::{current_timestamp, generate_id};
use crate::persistence::Persistence;
use crate::types::Task;
use clap::Subcommand;

#[derive(Subcommand)]
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

pub fn handle(cmd: TaskCommand, persistence: &Persistence) -> Result<CliOutput, String> {
    match cmd {
        TaskCommand::Create { project_id, name } => {
            let id = generate_id();
            let now = current_timestamp();
            let task = Task {
                id: id.clone(),
                project_id: project_id.clone(),
                parent_task_id: None,
                name: name.clone(),
                created_at: now,
                completed: false,
                original_name: Some(name),
                original_completed: Some(false),
                edit_history: Some(vec![]),
                archived: Some(false),
                status: Some(crate::types::TaskStatus::Todo),
            };
            persistence.tasks.create(task).map_err(|e| e.to_string())?;
            Ok(CliOutput::Success(MSG_TASK_CREATED.replace("{}", &id)))
        }
        TaskCommand::Archive { id, project_id } => {
            persistence
                .tasks
                .archive(id.clone(), project_id)
                .map_err(|e| e.to_string())?;
            Ok(CliOutput::Success(MSG_TASK_ARCHIVED.replace("{}", &id)))
        }
        TaskCommand::Rename { id, name } => {
            if let Some(mut task) = persistence.tasks.get(&id).map_err(|e| e.to_string())? {
                task.name = name;
                persistence.tasks.patch(task).map_err(|e| e.to_string())?;
                Ok(CliOutput::Success(MSG_TASK_RENAMED.replace("{}", &id)))
            } else {
                Err(MSG_TASK_NOT_FOUND.replace("{}", &id))
            }
        }
    }
}
