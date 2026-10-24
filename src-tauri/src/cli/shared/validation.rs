use crate::cli::error::{CliError, CliSyntaxError};

pub fn validate_id(id: &str) -> Result<String, CliError> {
    if id.trim().is_empty() {
        Err(CliError::Syntax(CliSyntaxError::EmptyId))
    } else {
        Ok(id.trim().to_string())
    }
}
