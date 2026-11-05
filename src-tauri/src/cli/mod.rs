pub mod error;
pub mod exporters;
pub mod formatters;
pub mod handlers;
pub mod parser;
pub mod resolver;
pub mod shared;

pub use error::{
    BusinessRuleViolation, CliError, CliErrorCode, CliErrorEnvelope, CliSyntaxError,
    LocalizedUserMessage,
};
pub use exporters::export_to_file;
pub use formatters::{format_duration, render_tree_string, ReportTreeDto};
pub use handlers::constants::{
    CONFIG_KEY_CLI_MACHINE_LOCALE, DEFAULT_CLI_MACHINE_LOCALE, SUPPORTED_CLI_MACHINE_LOCALES,
};
pub use parser::{CliArgs, CliCommand, CliCommands, ExportFormat};
pub use shared::output::CliOutput;
pub use shared::validation::validate_cli_machine_locale;

use crate::cli::shared::constants::EXIT_CODE_SUCCESS;
use crate::engine::Engine;
use crate::persistence::Persistence;
use std::process::ExitCode;

pub fn resolve_machine_locale(persistence: &Persistence) -> Result<String, CliError> {
    match persistence
        .cli
        .get_config_value(CONFIG_KEY_CLI_MACHINE_LOCALE)
    {
        Ok(None) => Ok(DEFAULT_CLI_MACHINE_LOCALE.to_string()),
        Ok(Some(val)) => {
            let valid = validate_cli_machine_locale(&val)?;
            Ok(valid.to_string())
        }
        Err(err) => Err(CliError::Storage(err)),
    }
}

pub fn handle_cli(
    args: CliArgs,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    handlers::dispatch_command(args, persistence, engine)
}

pub fn preprocess_args(
    raw_args: &[String],
    persistence: &Persistence,
    engine: &Engine,
) -> Result<Vec<String>, CliError> {
    handlers::mask_handler::preprocess_alias_invocation(raw_args, persistence, engine)
}

pub fn run(args: CliArgs, persistence: &Persistence, engine: &Engine) -> ExitCode {
    let is_machine = args.machine || args.json;
    match handle_cli(args, persistence, engine) {
        Ok(output) => {
            println!("{}", output);
            ExitCode::from(EXIT_CODE_SUCCESS)
        }
        Err(err) => {
            let machine_locale = if is_machine {
                match resolve_machine_locale(persistence) {
                    Ok(loc) => Some(loc),
                    Err(e) => {
                        let envelope =
                            e.to_envelope_with_mode(is_machine, Some(DEFAULT_CLI_MACHINE_LOCALE));
                        envelope.render_stderr(is_machine);
                        return envelope.to_exit_code();
                    }
                }
            } else {
                None
            };
            let envelope = err.to_envelope_with_mode(is_machine, machine_locale.as_deref());
            envelope.render_stderr(is_machine);
            envelope.to_exit_code()
        }
    }
}
