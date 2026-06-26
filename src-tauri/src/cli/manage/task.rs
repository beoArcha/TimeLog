use crate::cli::shared::constants::{MSG_TASK_ARCHIVED, MSG_TASK_CREATED};
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::{current_timestamp, generate_id};
use crate::persistence::PersistenceLayer;
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
}

pub fn handle(cmd: TaskCommand, persistence: &PersistenceLayer) -> Result<CliOutput, String> {
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
            };
            persistence.create_task(task).map_err(|e| e.to_string())?;
            Ok(CliOutput::Success(MSG_TASK_CREATED.replace("{}", &id)))
        }
        TaskCommand::Archive { id, project_id } => {
            persistence
                .archive_task(id.clone(), project_id)
                .map_err(|e| e.to_string())?;
            Ok(CliOutput::Success(MSG_TASK_ARCHIVED.replace("{}", &id)))
        }
    }
}
