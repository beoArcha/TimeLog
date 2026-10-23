#[derive(thiserror::Error, Debug)]
pub enum PersistenceError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("{entity} with id '{id}' not found")]
    NotFound { entity: &'static str, id: String },

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Initialization error: {0}")]
    Initialization(String),

    #[error("Storage error: {0}")]
    Storage(String),
}

pub type PersistenceResult<T> = std::result::Result<T, PersistenceError>;

impl From<crate::repositories::shared::errors::RepositoryError> for PersistenceError {
    fn from(err: crate::repositories::shared::errors::RepositoryError) -> Self {
        match err {
            crate::repositories::shared::errors::RepositoryError::Database(e) => {
                PersistenceError::Database(e)
            }
            crate::repositories::shared::errors::RepositoryError::Serialization(e) => {
                PersistenceError::Serialization(e)
            }
            crate::repositories::shared::errors::RepositoryError::NotFound { entity, id } => {
                PersistenceError::NotFound { entity, id }
            }
            crate::repositories::shared::errors::RepositoryError::Validation(e) => {
                PersistenceError::Validation(e)
            }
            crate::repositories::shared::errors::RepositoryError::ConstraintViolation(e) => {
                PersistenceError::Validation(e)
            }
        }
    }
}
