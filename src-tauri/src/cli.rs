use crate::services::timer_service;
use clap::{Parser, Subcommand};
use std::fmt;

#[derive(Parser)]
#[command(name = "oxytime-cli")]
pub struct CliArgs {
    #[command(subcommand)]
    pub command: CliCommands,
}

#[derive(Subcommand)]
pub enum CliCommands {
    Start { task_id: String },
    Stop,
    Status,
}

pub enum CliOutput {
    Started(String),
    Stopped,
    Status(Vec<String>),
}

impl fmt::Display for CliOutput {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CliOutput::Started(task_id) => write!(f, "▶️ Started tracking task: {}", task_id),
            CliOutput::Stopped => {
                write!(f, "⏹️ Stopped all active projects timer tracking threads.")
            }
            CliOutput::Status(active) => {
                writeln!(
                    f,
                    "⚡ Count of Concurrent Tracking Threads: {}",
                    active.len()
                )?;
                for id in active {
                    writeln!(f, "• Task active in SQLite: {}", id)?;
                }
                Ok(())
            }
        }
    }
}

pub fn handle_cli(args: CliArgs, conn: &rusqlite::Connection) -> Result<CliOutput, String> {
    match args.command {
        CliCommands::Start { task_id } => {
            timer_service::start(conn, &task_id).map_err(|e| e.to_string())?;
            Ok(CliOutput::Started(task_id))
        }
        CliCommands::Stop => {
            timer_service::stop(conn, None).map_err(|e| e.to_string())?;
            Ok(CliOutput::Stopped)
        }
        CliCommands::Status => {
            let active = timer_service::get_active(conn).map_err(|e| e.to_string())?;
            Ok(CliOutput::Status(active))
        }
    }
}
