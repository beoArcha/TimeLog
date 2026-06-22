#[derive(thiserror::Error, Debug)]
pub enum PersistenceError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("Validation error: {0}")]
    Validation(String),
}

pub type PersistenceResult<T> = std::result::Result<T, PersistenceError>;

impl From<String> for PersistenceError {
    fn from(err: String) -> Self {
        PersistenceError::Validation(err)
    }
}

impl From<crate::repositories::shared::errors::RepositoryError> for PersistenceError {
    fn from(err: crate::repositories::shared::errors::RepositoryError) -> Self {
        match err {
            crate::repositories::shared::errors::RepositoryError::Database(e) => {
                PersistenceError::Database(e)
            }
            crate::repositories::shared::errors::RepositoryError::Serialization(e) => {
                PersistenceError::Validation(e.to_string())
            }
            crate::repositories::shared::errors::RepositoryError::Validation(e) => {
                PersistenceError::Validation(e)
            }
        }
    }
}
