use super::codes::CliErrorCode;
use super::envelope::{CliErrorEnvelope, LocalizedUserMessage};
use super::exit_codes::{
    EXIT_CODE_CLI_SYNTAX, EXIT_CODE_ENGINE_ERROR, EXIT_CODE_ENTITY_ERROR,
    EXIT_CODE_GENERIC_FAILURE, EXIT_CODE_STORAGE_ERROR,
};
use crate::cli::resolver::ResolveError;
use crate::cli::shared::constants::{
    FORMAT_REMEDIATION_DID_YOU_MEAN, MSG_ERR_REMEDIATION_ENGINE, MSG_ERR_REMEDIATION_ENTITY,
    MSG_ERR_REMEDIATION_HELP, MSG_ERR_REMEDIATION_STORAGE,
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
            CliError::Entity(ref resolve_err) => match resolve_err {
                ResolveError::StorageError(_) => EXIT_CODE_STORAGE_ERROR,
                _ => EXIT_CODE_ENTITY_ERROR,
            },
            CliError::Storage(_) => EXIT_CODE_STORAGE_ERROR,
            CliError::Engine(_) => EXIT_CODE_ENGINE_ERROR,
            CliError::Business(_) => EXIT_CODE_GENERIC_FAILURE,
        }
    }

    pub fn error_code(&self) -> CliErrorCode {
        match self {
            CliError::Syntax(msg) => {
                if msg.contains("duration") || msg.contains("Duration") {
                    CliErrorCode::CliSyntaxInvalidDuration
                } else if msg.contains("empty") || msg.contains("ID cannot be empty") {
                    CliErrorCode::CliSyntaxEmptyId
                } else {
                    CliErrorCode::CliSyntaxInvalidArgs
                }
            }
            CliError::Entity(resolve_err) => match resolve_err {
                ResolveError::NotFound { .. } => CliErrorCode::DomEntityNotFound,
                ResolveError::AmbiguousMatch { .. } => CliErrorCode::DomEntityAmbiguous,
                ResolveError::DidYouMean { .. } => CliErrorCode::DomEntityDidYouMean,
                ResolveError::StorageError(_) => CliErrorCode::StoSqliteQuery,
            },
            CliError::Storage(msg) => {
                if msg.contains("Initialization") || msg.contains("init") {
                    CliErrorCode::StoSqliteInit
                } else {
                    CliErrorCode::StoSqliteQuery
                }
            }
            CliError::Engine(_) => CliErrorCode::EngTimerConflict,
            CliError::Business(msg) => {
                if msg.contains("No projects exist") {
                    CliErrorCode::DomBusinessNoProjects
                } else {
                    CliErrorCode::DomBusinessViolation
                }
            }
        }
    }

    pub fn to_envelope(&self, locale: Option<&str>) -> CliErrorEnvelope {
        let code = self.error_code();
        let exit_code = self.exit_code();
        let technical = self.to_string();
        let target_locale = locale.unwrap_or("en").to_string();

        let user = match self {
            CliError::Syntax(_) => Some(LocalizedUserMessage {
                locale: target_locale,
                message: technical.clone(),
                suggestion: None,
                remediation: Some(MSG_ERR_REMEDIATION_HELP.to_string()),
            }),
            CliError::Entity(resolve_err) => match resolve_err {
                ResolveError::NotFound { .. } => Some(LocalizedUserMessage {
                    locale: target_locale,
                    message: technical.clone(),
                    suggestion: None,
                    remediation: Some(MSG_ERR_REMEDIATION_ENTITY.to_string()),
                }),
                ResolveError::AmbiguousMatch { .. } => Some(LocalizedUserMessage {
                    locale: target_locale,
                    message: technical.clone(),
                    suggestion: None,
                    remediation: Some(MSG_ERR_REMEDIATION_ENTITY.to_string()),
                }),
                ResolveError::DidYouMean {
                    suggestion,
                    candidate_id,
                    ..
                } => Some(LocalizedUserMessage {
                    locale: target_locale,
                    message: technical.clone(),
                    suggestion: Some(suggestion.clone()),
                    remediation: Some(
                        FORMAT_REMEDIATION_DID_YOU_MEAN.replacen("{}", candidate_id, 1),
                    ),
                }),
                ResolveError::StorageError(_) => Some(LocalizedUserMessage {
                    locale: target_locale,
                    message: technical.clone(),
                    suggestion: None,
                    remediation: Some(MSG_ERR_REMEDIATION_STORAGE.to_string()),
                }),
            },
            CliError::Storage(_) => Some(LocalizedUserMessage {
                locale: target_locale,
                message: technical.clone(),
                suggestion: None,
                remediation: Some(MSG_ERR_REMEDIATION_STORAGE.to_string()),
            }),
            CliError::Engine(_) => Some(LocalizedUserMessage {
                locale: target_locale,
                message: technical.clone(),
                suggestion: None,
                remediation: Some(MSG_ERR_REMEDIATION_ENGINE.to_string()),
            }),
            CliError::Business(_) => Some(LocalizedUserMessage {
                locale: target_locale,
                message: technical.clone(),
                suggestion: None,
                remediation: Some(MSG_ERR_REMEDIATION_ENTITY.to_string()),
            }),
        };

        CliErrorEnvelope::new(code, exit_code, technical, user)
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
