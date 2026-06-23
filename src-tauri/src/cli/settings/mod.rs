use crate::cli::shared::output::CliOutput;
use crate::persistence::PersistenceLayer;
use clap::Subcommand;

pub mod settings;

#[derive(Subcommand)]
pub enum SettingsCommand {
    View,
}

pub fn handle(cmd: SettingsCommand, persistence: &PersistenceLayer) -> Result<CliOutput, String> {
    match cmd {
        SettingsCommand::View => settings::view(persistence),
    }
}
