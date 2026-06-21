#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clap::Parser;
use oxy_flow::{app, cli, engine};
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = std::env::args().collect();

    if args.len() > 1 {
        let db_path = app::get_cli_db_path();
        let db = engine::db::init_db(&db_path)?;
        if let Ok(cli_args) = cli::CliArgs::try_parse() {
            let output = cli::handle_cli(cli_args, &db)?;
            println!("{}", output);
            return Ok(());
        }
    }

    app::run_tauri();
    Ok(())
}
