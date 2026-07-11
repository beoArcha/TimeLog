use crate::cli::shared::output::CliOutput;
use crate::persistence::Persistence;
use clap::Subcommand;

#[allow(clippy::module_inception)]
pub mod settings;

#[derive(Subcommand)]
pub enum SettingsCommand {
    View,
}

pub fn handle(cmd: SettingsCommand, persistence: &Persistence) -> Result<CliOutput, String> {
    match cmd {
        SettingsCommand::View => settings::view(persistence),
    }
}
