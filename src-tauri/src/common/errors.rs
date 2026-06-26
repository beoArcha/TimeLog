use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Tauri error: {0}")]
    Tauri(#[from] tauri::Error),

    #[error("Application error: {0}")]
    Generic(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<crate::repositories::shared::errors::RepositoryError> for AppError {
    fn from(err: crate::repositories::shared::errors::RepositoryError) -> Self {
        match err {
            crate::repositories::shared::errors::RepositoryError::Database(e) => {
                AppError::Database(e)
            }
            crate::repositories::shared::errors::RepositoryError::Serialization(e) => {
                AppError::Generic(e.to_string())
            }
            crate::repositories::shared::errors::RepositoryError::Validation(e) => {
                AppError::Generic(e)
            }
        }
    }
}

impl From<crate::engine::EngineError> for AppError {
    fn from(err: crate::engine::EngineError) -> Self {
        match err {
            crate::engine::EngineError::Persistence(
                crate::persistence::PersistenceError::Database(e),
            ) => AppError::Database(e),
            _ => AppError::Generic(err.to_string()),
        }
    }
}
