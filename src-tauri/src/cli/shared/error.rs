use crate::cli::resolver::ResolveError;
use crate::cli::shared::constants::{
    EXIT_CODE_CLI_SYNTAX, EXIT_CODE_ENGINE_ERROR, EXIT_CODE_ENTITY_ERROR,
    EXIT_CODE_GENERIC_FAILURE, EXIT_CODE_STORAGE_ERROR,
};
use crate::cli::shared::utils::DurationParseError;
use std::fmt;

#[derive(Debug, PartialEq, Eq)]
pub enum CliError {
    Syntax(String),
    Entity(ResolveError),
    Storage(String),
    Engine(String),
    Business(String),
}

impl CliError {
    pub fn exit_code(&self) -> u8 {
        match self {
            CliError::Syntax(_) => EXIT_CODE_CLI_SYNTAX,
            CliError::Entity(_) => EXIT_CODE_ENTITY_ERROR,
            CliError::Storage(_) => EXIT_CODE_STORAGE_ERROR,
            CliError::Engine(_) => EXIT_CODE_ENGINE_ERROR,
            CliError::Business(_) => EXIT_CODE_GENERIC_FAILURE,
        }
    }
}

impl fmt::Display for CliError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CliError::Syntax(msg) => write!(f, "{}", msg),
            CliError::Entity(err) => write!(f, "{}", err),
            CliError::Storage(msg) => write!(f, "Storage error: {}", msg),
            CliError::Engine(msg) => write!(f, "Engine error: {}", msg),
            CliError::Business(msg) => write!(f, "{}", msg),
        }
    }
}

impl std::error::Error for CliError {}

impl From<ResolveError> for CliError {
    fn from(err: ResolveError) -> Self {
        match err {
            ResolveError::StorageError(msg) => CliError::Storage(msg),
            other => CliError::Entity(other),
        }
    }
}

impl From<DurationParseError> for CliError {
    fn from(err: DurationParseError) -> Self {
        CliError::Syntax(err.to_string())
    }
}
