pub mod error;
pub mod exporters;
pub mod formatters;
pub mod handlers;
pub mod manage;
pub mod parser;
pub mod resolver;
pub mod settings;
pub mod shared;
pub mod timer;

pub use error::{CliError, CliErrorCode, CliErrorEnvelope, LocalizedUserMessage};
pub use exporters::export_to_file;
pub use formatters::{format_duration, render_tree_string, ReportTreeDto};
pub use parser::{CliArgs, CliCommand, CliCommands, ExportFormat};
pub use shared::output::CliOutput;

use crate::cli::shared::constants::EXIT_CODE_SUCCESS;
use crate::engine::Engine;
use crate::persistence::Persistence;
use std::process::ExitCode;

pub fn handle_cli(
    args: CliArgs,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    handlers::dispatch_command(args, persistence, engine)
}

pub fn run(args: CliArgs, persistence: &Persistence, engine: &Engine) -> ExitCode {
    let is_machine = args.machine || args.json;
    match handle_cli(args, persistence, engine) {
        Ok(output) => {
            println!("{}", output);
            ExitCode::from(EXIT_CODE_SUCCESS)
        }
        Err(err) => {
            let envelope = err.to_envelope(None);
            envelope.render_stderr(is_machine);
            envelope.to_exit_code()
        }
    }
}
