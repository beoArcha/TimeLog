use crate::cli::shared::output::CliOutput;
use crate::persistence::PersistenceLayer;
use clap::Subcommand;

pub mod project;
pub mod subtask;
pub mod task;

#[derive(Subcommand)]
pub enum ManageCommand {
    #[command(subcommand)]
    Project(project::ProjectCommand),
    #[command(subcommand)]
    Task(task::TaskCommand),
    #[command(subcommand)]
    Subtask(subtask::SubtaskCommand),
}

pub fn handle(cmd: ManageCommand, persistence: &PersistenceLayer) -> Result<CliOutput, String> {
    match cmd {
        ManageCommand::Project(c) => project::handle(c, persistence),
        ManageCommand::Task(c) => task::handle(c, persistence),
        ManageCommand::Subtask(c) => subtask::handle(c, persistence),
    }
}
