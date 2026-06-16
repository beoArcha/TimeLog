//! CLI sub-dispatcher using Tauri State connection variables
use clap::{Parser, Subcommand};
use crate::engine::counting;

#[derive(Parser)]
#[command(name = "oxytime-cli")]
pub struct CliArgs {
    #[command(subcommand)]
    pub command: CliCommands,
}

#[derive(Subcommand)]
pub enum CliCommands {
    /// Start tracking a task ID
    Start { task_id: String },
    /// Stop tracking on all running projects
    Stop,
    /// List active worker daemons
    Status,
}

pub fn handle_cli(args: CliArgs, conn: &rusqlite::Connection) -> Result<(), String> {
    match args.command {
        CliCommands::Start { task_id } => {
            counting::start_project_timer(conn, &task_id).map_err(|e| e.to_string())?;
            println!("▶️ Started tracking task: {}", task_id);
        }
        CliCommands::Stop => {
            counting::stop_project_timer(conn, None).map_err(|e| e.to_string())?;
            println!("⏹️ Stopped all active projects timer tracking threads.");
        }
        CliCommands::Status => {
            let active = counting::query_active_logs(conn).map_err(|e| e.to_string())?;
            println!("⚡ Count of Concurrent Tracking Threads: {}", active.len());
            for id in active {
                println!("• Task active in SQLite: {}", id);
            }
        }
    }
    Ok(())
}
