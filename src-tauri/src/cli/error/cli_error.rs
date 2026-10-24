use super::codes::CliErrorCode;
use super::envelope::{CliErrorEnvelope, LocalizedUserMessage};
use super::exit_codes::{
    EXIT_CODE_CLI_SYNTAX, EXIT_CODE_ENGINE_ERROR, EXIT_CODE_ENTITY_ERROR,
    EXIT_CODE_GENERIC_FAILURE, EXIT_CODE_STORAGE_ERROR,
};
use crate::cli::resolver::ResolveError;
use crate::cli::shared::constants::{
    FORMAT_REMEDIATION_DID_YOU_MEAN, MSG_ERR_REMEDIATION_ENGINE, MSG_ERR_REMEDIATION_ENTITY,
    MSG_ERR_REMEDIATION_HELP, MSG_ERR_REMEDIATION_SINK, MSG_ERR_REMEDIATION_STORAGE,
};
use crate::cli::shared::utils::DurationParseError;
use crate::engine::EngineError;
use crate::persistence::PersistenceError;
use std::fmt;

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum CliSyntaxError {
    InvalidDuration(String),
    EmptyId,
    MissingTarget,
    InvalidArgs(String),
    UnknownCommand(String),
    AliasNotFound(String),
    MaskSyntax(String),
}

impl fmt::Display for CliSyntaxError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidDuration(msg) => write!(f, "Invalid duration format: {}", msg),
            Self::EmptyId => write!(f, "ID cannot be empty"),
            Self::MissingTarget => write!(f, "No target specified"),
            Self::InvalidArgs(msg) => write!(f, "{}", msg),
            Self::UnknownCommand(cmd) => write!(f, "Unknown command: {}", cmd),
            Self::AliasNotFound(name) => write!(f, "Alias '{}' not found", name),
            Self::MaskSyntax(msg) => write!(f, "Invalid mask syntax: {}", msg),
        }
    }
}

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum BusinessRuleViolation {
    NoProjectsExist,
    Constraint(String),
    Custom(String),
}

impl fmt::Display for BusinessRuleViolation {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NoProjectsExist => write!(f, "No projects exist"),
            Self::Constraint(msg) | Self::Custom(msg) => write!(f, "{}", msg),
        }
    }
}

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum SinkError {
    Io(String),
}

impl fmt::Display for SinkError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(msg) => write!(f, "Sink I/O error: {}", msg),
        }
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum CliError {
    Syntax(CliSyntaxError),
    Entity(ResolveError),
    Storage(PersistenceError),
    Engine(EngineError),
    Business(BusinessRuleViolation),
    Sink(SinkError),
}

impl CliError {
    pub fn syntax_invalid_args(msg: impl Into<String>) -> Self {
        CliError::Syntax(CliSyntaxError::InvalidArgs(msg.into()))
    }

    pub fn business_custom(msg: impl Into<String>) -> Self {
        CliError::Business(BusinessRuleViolation::Custom(msg.into()))
    }

    pub fn exit_code(&self) -> u8 {
        match self {
            CliError::Syntax(_) => EXIT_CODE_CLI_SYNTAX,
            CliError::Entity(resolve_err) => match resolve_err {
                ResolveError::StorageError(_) => EXIT_CODE_STORAGE_ERROR,
                ResolveError::NotFound {
                    entity_type: crate::cli::resolver::EntityType::MaskAlias,
                    ..
                } => EXIT_CODE_CLI_SYNTAX,
                _ => EXIT_CODE_ENTITY_ERROR,
            },
            CliError::Storage(_) => EXIT_CODE_STORAGE_ERROR,
            CliError::Engine(engine_err) => match engine_err {
                EngineError::NoActiveTimer | EngineError::ActiveTimerConflict { .. } => {
                    EXIT_CODE_ENGINE_ERROR
                }
                EngineError::OperationFailed(_) | EngineError::Validation(_) => {
                    EXIT_CODE_GENERIC_FAILURE
                }
                EngineError::EntityNotFound { .. } => EXIT_CODE_ENTITY_ERROR,
                EngineError::ParseTime(_) => EXIT_CODE_CLI_SYNTAX,
                EngineError::Persistence(_) => EXIT_CODE_STORAGE_ERROR,
            },
            CliError::Business(_) => EXIT_CODE_GENERIC_FAILURE,
            CliError::Sink(_) => EXIT_CODE_GENERIC_FAILURE,
        }
    }

    pub fn error_code(&self) -> CliErrorCode {
        match self {
            CliError::Syntax(syntax_err) => match syntax_err {
                CliSyntaxError::InvalidDuration(_) => CliErrorCode::CliSyntaxInvalidDuration,
                CliSyntaxError::EmptyId => CliErrorCode::CliSyntaxEmptyId,
                CliSyntaxError::MissingTarget => CliErrorCode::CliSyntaxMissingTarget,
                CliSyntaxError::InvalidArgs(_) => CliErrorCode::CliSyntaxInvalidArgs,
                CliSyntaxError::UnknownCommand(_) => CliErrorCode::CliSyntaxUnknownCommand,
                CliSyntaxError::AliasNotFound(_) => CliErrorCode::MskAliasNotFound,
                CliSyntaxError::MaskSyntax(_) => CliErrorCode::MskAliasSyntax,
            },
            CliError::Entity(resolve_err) => match resolve_err {
                ResolveError::NotFound {
                    entity_type: crate::cli::resolver::EntityType::MaskAlias,
                    ..
                } => CliErrorCode::MskAliasNotFound,
                ResolveError::NotFound { .. } => CliErrorCode::DomEntityNotFound,
                ResolveError::AmbiguousMatch { .. } => CliErrorCode::DomEntityAmbiguous,
                ResolveError::DidYouMean { .. } => CliErrorCode::DomEntityDidYouMean,
                ResolveError::StorageError(_) => CliErrorCode::StoSqliteQuery,
            },
            CliError::Storage(storage_err) => match storage_err {
                PersistenceError::Initialization(_) => CliErrorCode::StoSqliteInit,
                PersistenceError::ConstraintViolation(_) => CliErrorCode::StoSqliteConstraint,
                PersistenceError::Database(rusqlite::Error::SqliteFailure(err, _))
                    if err.code == rusqlite::ErrorCode::ConstraintViolation =>
                {
                    CliErrorCode::StoSqliteConstraint
                }
                _ => CliErrorCode::StoSqliteQuery,
            },
            CliError::Engine(engine_err) => match engine_err {
                EngineError::NoActiveTimer => CliErrorCode::EngTimerInactive,
                EngineError::ActiveTimerConflict { .. } => CliErrorCode::EngTimerConflict,
                EngineError::OperationFailed(_) => CliErrorCode::EngOperationFailed,
                EngineError::EntityNotFound { .. } => CliErrorCode::DomEntityNotFound,
                EngineError::Validation(_) => CliErrorCode::DomBusinessViolation,
                EngineError::ParseTime(_) => CliErrorCode::CliSyntaxInvalidDuration,
                EngineError::Persistence(_) => CliErrorCode::StoSqliteQuery,
            },
            CliError::Business(business_err) => match business_err {
                BusinessRuleViolation::NoProjectsExist => CliErrorCode::DomBusinessNoProjects,
                BusinessRuleViolation::Constraint(_) | BusinessRuleViolation::Custom(_) => {
                    CliErrorCode::DomBusinessViolation
                }
            },
            CliError::Sink(_) => CliErrorCode::SnkExternalIo,
        }
    }

    pub fn to_envelope(&self, locale: Option<&str>) -> CliErrorEnvelope {
        self.to_envelope_with_mode(false, locale)
    }

    pub fn to_machine_envelope(&self) -> CliErrorEnvelope {
        self.to_envelope_with_mode(true, None)
    }

    pub fn to_envelope_with_mode(
        &self,
        is_machine: bool,
        locale: Option<&str>,
    ) -> CliErrorEnvelope {
        let code = self.error_code();
        let exit_code = self.exit_code();
        let technical = self.to_string();
        let target_locale = locale.unwrap_or("en").to_string();

        let user = if is_machine {
            None
        } else {
            match self {
                CliError::Syntax(_) => Some(LocalizedUserMessage {
                    locale: target_locale,
                    message: technical.clone(),
                    suggestion: None,
                    remediation: Some(MSG_ERR_REMEDIATION_HELP.to_string()),
                }),
                CliError::Entity(resolve_err) => match resolve_err {
                    ResolveError::NotFound { .. } | ResolveError::AmbiguousMatch { .. } => {
                        Some(LocalizedUserMessage {
                            locale: target_locale,
                            message: technical.clone(),
                            suggestion: None,
                            remediation: Some(MSG_ERR_REMEDIATION_ENTITY.to_string()),
                        })
                    }
                    ResolveError::DidYouMean {
                        suggestion,
                        candidate_id,
                        ..
                    } => Some(LocalizedUserMessage {
                        locale: target_locale,
                        message: technical.clone(),
                        suggestion: Some(suggestion.clone()),
                        remediation: Some(FORMAT_REMEDIATION_DID_YOU_MEAN.replacen(
                            "{}",
                            candidate_id,
                            1,
                        )),
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
                CliError::Sink(_) => Some(LocalizedUserMessage {
                    locale: target_locale,
                    message: technical.clone(),
                    suggestion: None,
                    remediation: Some(MSG_ERR_REMEDIATION_SINK.to_string()),
                }),
            }
        };

        CliErrorEnvelope::new(code, exit_code, technical, user)
    }
}

impl fmt::Display for CliError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CliError::Syntax(err) => write!(f, "{}", err),
            CliError::Entity(err) => write!(f, "{}", err),
            CliError::Storage(err) => write!(f, "Storage error: {}", err),
            CliError::Engine(err) => write!(f, "Engine error: {}", err),
            CliError::Business(err) => write!(f, "{}", err),
            CliError::Sink(err) => write!(f, "{}", err),
        }
    }
}

impl std::error::Error for CliError {}

impl From<ResolveError> for CliError {
    fn from(err: ResolveError) -> Self {
        match err {
            ResolveError::StorageError(msg) => CliError::Storage(PersistenceError::Storage(msg)),
            other => CliError::Entity(other),
        }
    }
}

impl From<CliSyntaxError> for CliError {
    fn from(err: CliSyntaxError) -> Self {
        CliError::Syntax(err)
    }
}

impl From<BusinessRuleViolation> for CliError {
    fn from(err: BusinessRuleViolation) -> Self {
        CliError::Business(err)
    }
}

impl From<DurationParseError> for CliError {
    fn from(err: DurationParseError) -> Self {
        CliError::Syntax(CliSyntaxError::InvalidDuration(err.to_string()))
    }
}

impl From<SinkError> for CliError {
    fn from(err: SinkError) -> Self {
        CliError::Sink(err)
    }
}

impl From<serde_json::Error> for CliError {
    fn from(err: serde_json::Error) -> Self {
        CliError::Storage(PersistenceError::Serialization(err))
    }
}

impl From<PersistenceError> for CliError {
    fn from(err: PersistenceError) -> Self {
        match err {
            PersistenceError::NotFound { entity, id } => CliError::Entity(ResolveError::NotFound {
                target: id,
                entity_type: match entity {
                    "Project" => crate::cli::resolver::EntityType::Project,
                    "TimeLog" => crate::cli::resolver::EntityType::TimeLog,
                    _ => crate::cli::resolver::EntityType::Task,
                },
            }),
            other => CliError::Storage(other),
        }
    }
}

impl From<EngineError> for CliError {
    fn from(err: EngineError) -> Self {
        match err {
            EngineError::Persistence(p) => CliError::from(p),
            EngineError::NoActiveTimer => CliError::Engine(EngineError::NoActiveTimer),
            EngineError::ActiveTimerConflict { active_task_id } => {
                CliError::Engine(EngineError::ActiveTimerConflict { active_task_id })
            }
            EngineError::EntityNotFound { entity, id } => {
                CliError::Entity(ResolveError::NotFound {
                    target: id,
                    entity_type: match entity {
                        "Project" => crate::cli::resolver::EntityType::Project,
                        "TimeLog" => crate::cli::resolver::EntityType::TimeLog,
                        _ => crate::cli::resolver::EntityType::Task,
                    },
                })
            }
            EngineError::Validation(v) => CliError::Business(BusinessRuleViolation::Custom(v)),
            EngineError::ParseTime(t) => CliError::Syntax(CliSyntaxError::InvalidDuration(t)),
            EngineError::OperationFailed(m) => CliError::Engine(EngineError::OperationFailed(m)),
        }
    }
}
