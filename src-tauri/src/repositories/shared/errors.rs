use thiserror::Error;

#[derive(Error, Debug)]
pub enum RepositoryError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("{entity} with id '{id}' not found")]
    NotFound { entity: &'static str, id: String },

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Constraint violation: {0}")]
    ConstraintViolation(String),
}

pub type Result<T> = std::result::Result<T, RepositoryError>;
