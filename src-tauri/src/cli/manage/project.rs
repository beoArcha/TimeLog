use crate::cli::shared::constants::{
    DEFAULT_COLOR, MSG_LIST_NOT_IMPLEMENTED, MSG_PROJECT_ARCHIVED, MSG_PROJECT_CREATED,
};
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::{current_timestamp, generate_id};
use crate::persistence::PersistenceLayer;
use crate::types::Project;
use clap::Subcommand;

#[derive(Subcommand)]
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
}

pub fn handle(cmd: ProjectCommand, persistence: &PersistenceLayer) -> Result<CliOutput, String> {
    match cmd {
        ProjectCommand::Create { name, color } => {
            let id = generate_id();
            let now = current_timestamp();
            let project = Project {
                id: id.clone(),
                name: name.clone(),
                color: color.clone().unwrap_or_else(|| DEFAULT_COLOR.to_string()),
                created_at: now,
                archived: Some(false),
                original_name: Some(name),
                original_color: color,
                edit_history: Some(vec![]),
            };
            persistence
                .create_project(project)
                .map_err(|e| e.to_string())?;
            Ok(CliOutput::Success(MSG_PROJECT_CREATED.replace("{}", &id)))
        }
        ProjectCommand::List => Ok(CliOutput::Success(MSG_LIST_NOT_IMPLEMENTED.to_string())),
        ProjectCommand::Archive { id } => {
            persistence
                .archive_project(id.clone())
                .map_err(|e| e.to_string())?;
            Ok(CliOutput::Success(MSG_PROJECT_ARCHIVED.replace("{}", &id)))
        }
    }
}
