#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clap::Parser;
use oxy_flow::{app, cli};
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = std::env::args().collect();

    if args.len() > 1 {
        let db_path = app::get_cli_db_path();
        let csv_directory = db_path
            .parent()
            .ok_or("Invalid DB path parent")?
            .join("csv");
        let persistence_config = oxy_flow::persistence::PersistenceConfig {
            db_path,
            csv_directory,
        };
        let persistence = oxy_flow::persistence::Persistence::new(&persistence_config)?;
        let engine = oxy_flow::engine::Engine::new(&persistence);
        if let Ok(cli_args) = cli::CliArgs::try_parse() {
            let output = cli::handle_cli(cli_args, &persistence, &engine)?;
            println!("{}", output);
            return Ok(());
        }
    }

    app::run_tauri();
    Ok(())
}
