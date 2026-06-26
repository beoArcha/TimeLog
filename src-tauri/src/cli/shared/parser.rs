use clap::{Parser, Subcommand};

use crate::cli::manage::ManageCommand;
use crate::cli::settings::SettingsCommand;
use crate::cli::timer::TimerCommand;

#[derive(Parser)]
#[command(name = "oxytime-cli")]
pub struct CliArgs {
    #[command(subcommand)]
    pub command: CliCommands,
}

#[derive(Subcommand)]
pub enum CliCommands {
    #[command(subcommand)]
    Manage(ManageCommand),
    #[command(subcommand)]
    Settings(SettingsCommand),
    #[command(subcommand)]
    Timer(TimerCommand),
}
