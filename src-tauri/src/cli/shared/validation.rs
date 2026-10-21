use crate::cli::error::CliError;
use crate::cli::shared::constants::MSG_ID_EMPTY;

pub fn validate_id(id: &str) -> Result<String, CliError> {
    if id.trim().is_empty() {
        Err(CliError::Syntax(MSG_ID_EMPTY.to_string()))
    } else {
        Ok(id.trim().to_string())
    }
}
