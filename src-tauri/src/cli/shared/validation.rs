use crate::cli::error::{CliError, CliSyntaxError};
use crate::cli::handlers::constants::{
    ERR_CONFIG_INVALID_MACHINE_LOCALE, SUPPORTED_CLI_MACHINE_LOCALES,
};

pub fn validate_id(id: &str) -> Result<String, CliError> {
    if id.trim().is_empty() {
        Err(CliError::Syntax(CliSyntaxError::EmptyId))
    } else {
        Ok(id.trim().to_string())
    }
}

pub fn validate_cli_machine_locale(locale: &str) -> Result<&'static str, CliError> {
    let trimmed = locale.trim().to_ascii_lowercase();
    for &supported in SUPPORTED_CLI_MACHINE_LOCALES {
        if trimmed == supported {
            return Ok(supported);
        }
    }
    Err(CliError::Syntax(CliSyntaxError::InvalidArgs(
        ERR_CONFIG_INVALID_MACHINE_LOCALE.replacen("{}", locale.trim(), 1),
    )))
}
