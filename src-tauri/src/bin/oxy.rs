use clap::Parser;
use oxy_flow::cli::{self, CliArgs, CliError};
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

    let is_machine = cli_args.machine || cli_args.json;
    let db_path = get_default_db_path();
    let csv_directory = get_default_csv_dir(&db_path);
    let persistence_config = PersistenceConfig {
        db_path,
        csv_directory,
    };

    let persistence = match Persistence::new(&persistence_config) {
        Ok(p) => p,
        Err(e) => {
            let err = CliError::Storage(e.to_string());
            let envelope = err.to_envelope(None);
            envelope.render_stderr(is_machine);
            return envelope.to_exit_code();
        }
    };

    let engine = Engine::new(&persistence);
    cli::run(cli_args, &persistence, &engine)
}
