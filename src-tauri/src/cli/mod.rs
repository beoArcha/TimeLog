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

pub fn extract_early_db_flag(args: &[String]) -> Option<String> {
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

/// Resolves the locale to use for error envelope formatting based on lifecycle stages:
/// - Stage A (before DB open / persistence is None): uses explicit "en" fallback.
/// - Stage B (after DB open): resolves locale from persistence via `resolve_machine_locale`.
/// - Stage C (locale resolution failure): logs error via `log::error!`, preserves primary error,
///   and returns explicit "en" fallback safely.
pub fn resolve_envelope_locale(
    is_machine: bool,
    persistence: Option<&Persistence>,
) -> Option<String> {
    if !is_machine {
        return None;
    }
    match persistence {
        Some(p) => match resolve_machine_locale(p) {
            Ok(loc) => Some(loc),
            Err(e) => {
                log::error!("Failed to resolve machine locale from database: {e}");
                Some(DEFAULT_CLI_MACHINE_LOCALE.to_string())
            }
        },
        None => Some(DEFAULT_CLI_MACHINE_LOCALE.to_string()),
    }
}

/// Builds an error envelope adhering to CLI lifecycle stages (Stage A, Stage B, Stage C):
/// - Stage A: When `persistence` is `None` (pre-DB open, e.g. path resolution or DB init error).
/// - Stage B: When `persistence` is `Some` and machine locale resolves successfully from DB.
/// - Stage C: When `persistence` is `Some` but machine locale resolution fails (infrastructure
///   or corruption); logs the failure, preserves the primary `err`, and uses safe fallback envelope.
pub fn build_error_envelope(
    err: &CliError,
    is_machine: bool,
    persistence: Option<&Persistence>,
) -> CliErrorEnvelope {
    let locale = resolve_envelope_locale(is_machine, persistence);
    err.to_envelope_with_mode(is_machine, locale.as_deref())
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
            let envelope = build_error_envelope(&err, is_machine, Some(persistence));
            envelope.render_stderr(is_machine);
            envelope.to_exit_code()
        }
    }
}
