pub mod handlers;
pub mod manage;
pub mod parser;
pub mod resolver;
pub mod settings;
pub mod shared;
pub mod timer;

pub use parser::{CliArgs, CliCommand, CliCommands, ExportFormat};
pub use shared::error::CliError;
pub use shared::output::CliOutput;

use crate::cli::shared::constants::{ERR_CLI_PREFIX, EXIT_CODE_SUCCESS};
use crate::engine::Engine;
use crate::persistence::Persistence;
use std::process::ExitCode;

pub fn handle_cli(
    args: CliArgs,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    handlers::dispatch_command(args.command, persistence, engine)
}

pub fn run(args: CliArgs, persistence: &Persistence, engine: &Engine) -> ExitCode {
    match handle_cli(args, persistence, engine) {
        Ok(output) => {
            println!("{}", output);
            ExitCode::from(EXIT_CODE_SUCCESS)
        }
        Err(err) => {
            eprintln!("{}", ERR_CLI_PREFIX.replace("{}", &err.to_string()));
            ExitCode::from(err.exit_code())
        }
    }
}
