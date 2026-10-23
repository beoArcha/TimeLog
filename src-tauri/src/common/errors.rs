use crate::types::IpcErrorPayload;
use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Tauri error: {0}")]
    Tauri(#[from] tauri::Error),

    #[error("Persistence error: {0}")]
    Persistence(#[from] crate::persistence::PersistenceError),

    #[error("Engine error: {0}")]
    Engine(#[from] crate::engine::EngineError),

    #[error("Application error: {0}")]
    Generic(String),
}

fn persistence_to_payload(p: &crate::persistence::PersistenceError) -> IpcErrorPayload {
    match p {
        crate::persistence::PersistenceError::NotFound { entity, id } => IpcErrorPayload::new(
            "DOM_ENTITY_NOT_FOUND",
            format!("{} with id '{}' not found", entity, id),
            Some(format!("entity={}, id={}", entity, id)),
        ),
        crate::persistence::PersistenceError::Database(e) => {
            IpcErrorPayload::new("STO_SQLITE_ERROR", p.to_string(), Some(format!("{:?}", e)))
        }
        crate::persistence::PersistenceError::Initialization(msg) => {
            IpcErrorPayload::new("STO_SQLITE_INIT", p.to_string(), Some(msg.clone()))
        }
        crate::persistence::PersistenceError::Validation(msg) => {
            IpcErrorPayload::new("DOM_BUSINESS_VIOLATION", p.to_string(), Some(msg.clone()))
        }
        crate::persistence::PersistenceError::Storage(msg) => {
            IpcErrorPayload::new("STO_STORAGE_ERROR", p.to_string(), Some(msg.clone()))
        }
        crate::persistence::PersistenceError::Serialization(e) => IpcErrorPayload::new(
            "STO_SERIALIZATION_ERROR",
            p.to_string(),
            Some(format!("{:?}", e)),
        ),
    }
}

impl AppError {
    pub fn to_payload(&self) -> IpcErrorPayload {
        match self {
            AppError::Database(e) => IpcErrorPayload::new(
                "STO_SQLITE_ERROR",
                self.to_string(),
                Some(format!("{:?}", e)),
            ),
            AppError::Tauri(e) => IpcErrorPayload::new(
                "IPC_TAURI_ERROR",
                self.to_string(),
                Some(format!("{:?}", e)),
            ),
            AppError::Persistence(p) => persistence_to_payload(p),
            AppError::Engine(e) => match e {
                crate::engine::EngineError::NoActiveTimer => {
                    IpcErrorPayload::new("ENG_TIMER_INACTIVE", e.to_string(), None)
                }
                crate::engine::EngineError::ActiveTimerConflict { active_task_id } => {
                    IpcErrorPayload::new(
                        "ENG_TIMER_CONFLICT",
                        e.to_string(),
                        Some(format!("active_task_id={}", active_task_id)),
                    )
                }
                crate::engine::EngineError::EntityNotFound { entity, id } => IpcErrorPayload::new(
                    "DOM_ENTITY_NOT_FOUND",
                    format!("{} with id '{}' not found", entity, id),
                    Some(format!("entity={}, id={}", entity, id)),
                ),
                crate::engine::EngineError::Validation(v) => {
                    IpcErrorPayload::new("DOM_BUSINESS_VIOLATION", e.to_string(), Some(v.clone()))
                }
                crate::engine::EngineError::ParseTime(t) => IpcErrorPayload::new(
                    "CLI_SYNTAX_INVALID_DURATION",
                    e.to_string(),
                    Some(t.clone()),
                ),
                crate::engine::EngineError::Persistence(p) => persistence_to_payload(p),
                crate::engine::EngineError::OperationFailed(m) => {
                    IpcErrorPayload::new("ENG_OPERATION_FAILED", e.to_string(), Some(m.clone()))
                }
            },
            AppError::Generic(msg) => {
                IpcErrorPayload::new("GEN_APPLICATION_ERROR", msg.clone(), None)
            }
        }
    }
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.to_payload().serialize(serializer)
    }
}

impl From<crate::repositories::shared::errors::RepositoryError> for AppError {
    fn from(err: crate::repositories::shared::errors::RepositoryError) -> Self {
        AppError::Persistence(crate::persistence::PersistenceError::from(err))
    }
}
