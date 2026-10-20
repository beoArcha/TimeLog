use crate::cli::error::CliError;
use crate::cli::shared::output::CliOutput;
use crate::persistence::Persistence;
use clap::Subcommand;

#[allow(clippy::module_inception)]
pub mod settings;

#[derive(Debug, Clone, Subcommand)]
pub enum SettingsCommand {
    View,
}

pub fn handle(cmd: SettingsCommand, persistence: &Persistence) -> Result<CliOutput, CliError> {
    match cmd {
        SettingsCommand::View => settings::view(persistence),
    }
}
