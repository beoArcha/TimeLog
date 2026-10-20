use crate::cli::error::CliError;
use crate::cli::shared::output::CliOutput;
use crate::persistence::Persistence;
use clap::Subcommand;

pub mod constants;
pub mod project;
pub mod subtask;
pub mod task;

#[derive(Debug, Clone, Subcommand)]
pub enum ManageCommand {
    #[command(subcommand)]
    Project(project::ProjectCommand),
    #[command(subcommand)]
    Task(task::TaskCommand),
    #[command(subcommand)]
    Subtask(subtask::SubtaskCommand),
}

pub fn handle(cmd: ManageCommand, persistence: &Persistence) -> Result<CliOutput, CliError> {
    match cmd {
        ManageCommand::Project(c) => project::handle(c, persistence),
        ManageCommand::Task(c) => task::handle(c, persistence),
        ManageCommand::Subtask(c) => subtask::handle(c, persistence),
    }
}
