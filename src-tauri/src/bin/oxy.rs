use clap::Parser;
use oxy_flow::cli::{self, CliArgs};
use oxy_flow::common::paths::{get_default_csv_dir, get_default_db_path};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::{Persistence, PersistenceConfig};
use std::process::ExitCode;

fn main() -> ExitCode {
    let cli_args = match CliArgs::try_parse() {
        Ok(parsed) => parsed,
        Err(err) => {
            err.exit();
        }
    };

    let db_path = get_default_db_path();
    let csv_directory = get_default_csv_dir(&db_path);
    let persistence_config = PersistenceConfig {
        db_path,
        csv_directory,
    };

    let persistence = match Persistence::new(&persistence_config) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Storage Initialization Error: {e}");
            return ExitCode::from(3);
        }
    };

    let engine = Engine::new(&persistence);

    match cli::handle_cli(cli_args, &persistence, &engine) {
        Ok(output) => {
            println!("{}", output);
            ExitCode::SUCCESS
        }
        Err(err) => {
            eprintln!("Error: {}", err);
            ExitCode::from(1)
        }
    }
}
