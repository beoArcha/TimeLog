use crate::cli::shared::constants::{MSG_SUBTASK_ARCHIVED, MSG_SUBTASK_CREATED};
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::{current_timestamp, generate_id};
use crate::persistence::PersistenceLayer;
use crate::types::Task;
use clap::Subcommand;

#[derive(Subcommand)]
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
}

pub fn handle(cmd: SubtaskCommand, persistence: &PersistenceLayer) -> Result<CliOutput, String> {
    match cmd {
        SubtaskCommand::Create { task_id, name } => {
            let project_id = persistence
                .tasks
                .get_project_id_by_task_id(&task_id)
                .map_err(|e| e.to_string())?;
            let id = generate_id();
            let now = current_timestamp();
            let subtask = Task {
                id: id.clone(),
                project_id,
                parent_task_id: Some(task_id.clone()),
                name: name.clone(),
                created_at: now,
                completed: false,
                original_name: Some(name),
                original_completed: Some(false),
                edit_history: Some(vec![]),
                archived: Some(false),
            };
            persistence
                .tasks
                .create_subtask(subtask)
                .map_err(|e| e.to_string())?;
            Ok(CliOutput::Success(MSG_SUBTASK_CREATED.replace("{}", &id)))
        }
        SubtaskCommand::Archive { id, task_id } => {
            persistence
                .tasks
                .archive_subtask(id.clone(), task_id)
                .map_err(|e| e.to_string())?;
            Ok(CliOutput::Success(MSG_SUBTASK_ARCHIVED.replace("{}", &id)))
        }
    }
}
