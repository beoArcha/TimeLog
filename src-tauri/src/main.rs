#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clap::Parser;
use oxyflow_timelog::{app, cli};
use std::process::ExitCode;

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().collect();

    if args.len() > 1 {
        oxyflow_timelog::common::attach_parent_console();

        let cli_args = match cli::CliArgs::try_parse() {
            Ok(parsed) => parsed,
            Err(err) => {
                err.exit();
            }
        };

        let is_machine = cli_args.machine || cli_args.json;
        let db_path = match oxyflow_timelog::common::paths::resolve_db_path(cli_args.db.as_deref()) {
            Ok(path) => path,
            Err(e) => {
                let err = cli::CliError::Storage(
                    oxyflow_timelog::persistence::error::PersistenceError::Storage(format!(
                        "Failed to resolve database path: {e}"
                    )),
                );
                let envelope = err.to_envelope_with_mode(is_machine, None);
                envelope.render_stderr(is_machine);
                return envelope.to_exit_code();
            }
        };
        let csv_directory = oxyflow_timelog::common::paths::get_default_csv_dir(&db_path);
        let persistence_config = oxyflow_timelog::persistence::PersistenceConfig {
            db_path,
            csv_directory,
        };
        let persistence = match oxyflow_timelog::persistence::Persistence::new(&persistence_config) {
            Ok(p) => p,
            Err(e) => {
                let err = cli::CliError::from(e);
                let envelope = err.to_envelope_with_mode(is_machine, None);
                envelope.render_stderr(is_machine);
                return envelope.to_exit_code();
            }
        };
        let engine = oxyflow_timelog::engine::Engine::new(&persistence);
        return cli::run(cli_args, &persistence, &engine);
    }

    app::run_tauri();
    ExitCode::SUCCESS
}
