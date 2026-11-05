use clap::Parser;
use oxyflow_timelog::cli::{self, CliArgs, CliError};
use oxyflow_timelog::common::paths::{get_default_csv_dir, resolve_db_path};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::{Persistence, PersistenceConfig};
use std::process::ExitCode;

fn main() -> ExitCode {
    let raw_args: Vec<String> = std::env::args().collect();
    let is_machine = raw_args
        .iter()
        .any(|a| a == "-m" || a == "--machine" || a == "-j" || a == "--json");

    if let Err(err) = CliArgs::try_parse_from(&raw_args) {
        if err.kind() == clap::error::ErrorKind::DisplayHelp
            || err.kind() == clap::error::ErrorKind::DisplayVersion
        {
            err.exit();
        }
    }

    // Stage A: Before DB open
    let early_db = cli::extract_early_db_flag(&raw_args);
    let db_path = match resolve_db_path(early_db.as_deref()) {
        Ok(path) => path,
        Err(e) => {
            let err = CliError::Storage(
                oxyflow_timelog::persistence::error::PersistenceError::Storage(format!(
                    "Failed to resolve database path: {e}"
                )),
            );
            let envelope = cli::build_error_envelope(&err, is_machine, None);
            envelope.render_stderr(is_machine);
            return envelope.to_exit_code();
        }
    };

    let csv_directory = get_default_csv_dir(&db_path);
    let persistence_config = PersistenceConfig {
        db_path,
        csv_directory,
    };

    let persistence = match Persistence::new(&persistence_config) {
        Ok(p) => p,
        Err(e) => {
            let err = CliError::from(e);
            let envelope = cli::build_error_envelope(&err, is_machine, None);
            envelope.render_stderr(is_machine);
            return envelope.to_exit_code();
        }
    };

    let engine = Engine::new(&persistence);

    // Stage B & C: After DB open
    let effective_args = match cli::preprocess_args(&raw_args, &persistence, &engine) {
        Ok(args) => args,
        Err(err) => {
            let envelope = cli::build_error_envelope(&err, is_machine, Some(&persistence));
            envelope.render_stderr(is_machine);
            return envelope.to_exit_code();
        }
    };

    let cli_args = match CliArgs::try_parse_from(&effective_args) {
        Ok(parsed) => parsed,
        Err(err) => {
            err.exit();
        }
    };

    cli::run(cli_args, &persistence, &engine)
}
