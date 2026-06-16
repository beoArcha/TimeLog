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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::db::init_db_in_memory;

    #[test]
    fn test_handle_cli_start_and_status() -> Result<(), String> {
        let conn = init_db_in_memory().map_err(|e| e.to_string())?;
        let now = chrono::Utc::now().to_rfc3339();
        
        conn.execute("INSERT INTO projects (id, name, color, created_at) VALUES ('p1', 'CliProj', 'blue', ?)", [&now]).map_err(|e| e.to_string())?;
        conn.execute("INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t1', 'p1', 'CliTask', ?)", [&now]).map_err(|e| e.to_string())?;

        // 1. Start command
        let start_args = CliArgs {
            command: CliCommands::Start { task_id: "t1".to_string() }
        };
        handle_cli(start_args, &conn)?;

        // Check if logs reflect active task
        let active = counting::query_active_logs(&conn).map_err(|e| e.to_string())?;
        assert_eq!(active.len(), 1);
        assert_eq!(active[0], "t1");

        // 2. Status command (outputs to stdout, but we ensure it doesn't panic)
        let status_args = CliArgs {
            command: CliCommands::Status
        };
        handle_cli(status_args, &conn)?;

        // 3. Stop command
        let stop_args = CliArgs {
            command: CliCommands::Stop
        };
        handle_cli(stop_args, &conn)?;

        let active_after_stop = counting::query_active_logs(&conn).map_err(|e| e.to_string())?;
        assert_eq!(active_after_stop.len(), 0);

        Ok(())
    }
}
