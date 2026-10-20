#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clap::Parser;
use oxy_flow::{app, cli};
use std::process::ExitCode;

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().collect();

    if args.len() > 1 {
        let cli_args = match cli::CliArgs::try_parse() {
            Ok(parsed) => parsed,
            Err(err) => {
                err.exit();
            }
        };

        let db_path = oxy_flow::common::paths::get_default_db_path();
        let csv_directory = oxy_flow::common::paths::get_default_csv_dir(&db_path);
        let persistence_config = oxy_flow::persistence::PersistenceConfig {
            db_path,
            csv_directory,
        };
        let persistence = match oxy_flow::persistence::Persistence::new(&persistence_config) {
            Ok(p) => p,
            Err(e) => {
                eprintln!("Error initializing storage: {e}");
                return ExitCode::from(oxy_flow::cli::shared::constants::EXIT_CODE_STORAGE_ERROR);
            }
        };
        let engine = oxy_flow::engine::Engine::new(&persistence);
        return cli::run(cli_args, &persistence, &engine);
    }

    app::run_tauri();
    ExitCode::SUCCESS
}
