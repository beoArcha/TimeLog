use crate::engine::counting;
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
            counting::start_project_timer(conn, &task_id).map_err(|e| e.to_string())?;
            Ok(CliOutput::Started(task_id))
        }
        CliCommands::Stop => {
            counting::stop_project_timer(conn, None).map_err(|e| e.to_string())?;
            Ok(CliOutput::Stopped)
        }
        CliCommands::Status => {
            let active = counting::query_active_logs(conn).map_err(|e| e.to_string())?;
            Ok(CliOutput::Status(active))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::test_helpers::TestDb;

    fn setup() -> rusqlite::Connection {
        TestDb::new()
            .with_project("p1", "CliProj", "blue")
            .with_task("t1", "p1", "CliTask")
            .conn
    }

    #[test]
    fn test_cli_start_returns_started_output() {
        let conn = setup();
        let result = handle_cli(
            CliArgs {
                command: CliCommands::Start {
                    task_id: "t1".to_string(),
                },
            },
            &conn,
        );
        assert!(result.is_ok(), "start should succeed");
        let output = result.unwrap();
        assert!(
            matches!(output, CliOutput::Started(ref id) if id == "t1"),
            "should return Started with task id"
        );
    }

    #[test]
    fn test_cli_start_output_displays_correctly() {
        let output = CliOutput::Started("t1".to_string());
        let text = format!("{}", output);
        assert!(text.contains("t1"));
        assert!(text.contains("▶️"));
    }

    #[test]
    fn test_cli_status_returns_active_tasks() {
        let conn = setup();
        counting::start_project_timer(&conn, "t1").expect("start failed");

        let result = handle_cli(
            CliArgs {
                command: CliCommands::Status,
            },
            &conn,
        );
        assert!(result.is_ok());
        match result.unwrap() {
            CliOutput::Status(active) => {
                assert_eq!(active.len(), 1);
                assert_eq!(active[0], "t1");
            }
            other => panic!("Expected Status, got {}", other),
        }
    }

    #[test]
    fn test_cli_status_empty_when_no_timer_running() {
        let conn = setup();
        let result = handle_cli(
            CliArgs {
                command: CliCommands::Status,
            },
            &conn,
        );
        assert!(result.is_ok());
        match result.unwrap() {
            CliOutput::Status(active) => assert_eq!(active.len(), 0),
            other => panic!("Expected Status, got {}", other),
        }
    }

    #[test]
    fn test_cli_stop_returns_stopped_output() {
        let conn = setup();
        counting::start_project_timer(&conn, "t1").expect("start failed");

        let result = handle_cli(
            CliArgs {
                command: CliCommands::Stop,
            },
            &conn,
        );
        assert!(result.is_ok());
        assert!(matches!(result.unwrap(), CliOutput::Stopped));

        let active = counting::query_active_logs(&conn).expect("query failed");
        assert_eq!(active.len(), 0);
    }

    #[test]
    fn test_cli_stop_when_nothing_running_is_ok() {
        let conn = setup();
        let result = handle_cli(
            CliArgs {
                command: CliCommands::Stop,
            },
            &conn,
        );
        assert!(
            result.is_ok(),
            "Stop with no running timer should not error"
        );
    }

    #[test]
    fn test_cli_nonexistent_task_fails() {
        let conn = setup();
        let result = handle_cli(
            CliArgs {
                command: CliCommands::Start {
                    task_id: "nonexistent".to_string(),
                },
            },
            &conn,
        );
        assert!(result.is_err(), "Starting nonexistent task should fail");
    }

    #[test]
    fn test_cli_output_stopped_displays_correctly() {
        let text = format!("{}", CliOutput::Stopped);
        assert!(text.contains("⏹️"));
    }

    #[test]
    fn test_cli_output_status_displays_correctly() {
        let output = CliOutput::Status(vec!["t1".to_string(), "t2".to_string()]);
        let text = format!("{}", output);
        assert!(text.contains("2"));
        assert!(text.contains("t1"));
        assert!(text.contains("t2"));
    }
}
