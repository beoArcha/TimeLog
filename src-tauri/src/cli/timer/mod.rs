#[allow(clippy::module_inception)]
mod timer;

use crate::cli::shared::error::CliError;
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use clap::Subcommand;

#[derive(Debug, Clone, Subcommand)]
pub enum TimerCommand {
    Start { task_id: String },
    Stop,
    Status,
}

pub fn handle(cmd: TimerCommand, engine: &Engine) -> Result<CliOutput, CliError> {
    match cmd {
        TimerCommand::Start { task_id } => timer::start(task_id, engine),
        TimerCommand::Stop => timer::stop(engine),
        TimerCommand::Status => timer::status(engine),
    }
}
