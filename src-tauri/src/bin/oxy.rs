use clap::Parser;
use oxy_flow::cli::{self, CliArgs, CliError};
use oxy_flow::common::paths::{get_default_csv_dir, resolve_db_path};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::{Persistence, PersistenceConfig};
use std::process::ExitCode;

fn main() -> ExitCode {
    let raw_args: Vec<String> = std::env::args().collect();
    let is_machine = raw_args
        .iter()
        .any(|a| a == "-m" || a == "--machine" || a == "-j" || a == "--json");

    let early_db = extract_early_db_flag(&raw_args);
    let db_path = match resolve_db_path(early_db.as_deref()) {
        Ok(path) => path,
        Err(e) => {
            let err = CliError::Storage(oxy_flow::persistence::error::PersistenceError::Storage(
                format!("Failed to resolve database path: {e}"),
            ));
            let envelope = err.to_envelope_with_mode(is_machine, None);
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
            let envelope = err.to_envelope_with_mode(is_machine, None);
            envelope.render_stderr(is_machine);
            return envelope.to_exit_code();
        }
    };

    let engine = Engine::new(&persistence);

    let effective_args = match cli::preprocess_args(&raw_args, &persistence, &engine) {
        Ok(args) => args,
        Err(err) => {
            let envelope = err.to_envelope_with_mode(is_machine, None);
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

fn extract_early_db_flag(args: &[String]) -> Option<String> {
    let mut iter = args.iter().skip(1);
    while let Some(arg) = iter.next() {
        if arg == "--db" {
            return iter.next().cloned();
        }
        if let Some(stripped) = arg.strip_prefix("--db=") {
            return Some(stripped.to_string());
        }
    }
    None
}
