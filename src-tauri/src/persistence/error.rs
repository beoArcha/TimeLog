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

    #[error("Constraint violation: {0}")]
    ConstraintViolation(String),

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
                PersistenceError::ConstraintViolation(e)
            }
            crate::repositories::shared::errors::RepositoryError::Storage(e) => {
                PersistenceError::Storage(e)
            }
        }
    }
}

impl PartialEq for PersistenceError {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (
                Self::NotFound {
                    entity: e1,
                    id: id1,
                },
                Self::NotFound {
                    entity: e2,
                    id: id2,
                },
            ) => e1 == e2 && id1 == id2,
            (Self::Validation(v1), Self::Validation(v2)) => v1 == v2,
            (Self::ConstraintViolation(c1), Self::ConstraintViolation(c2)) => c1 == c2,
            (Self::Initialization(i1), Self::Initialization(i2)) => i1 == i2,
            (Self::Storage(s1), Self::Storage(s2)) => s1 == s2,
            (Self::Database(d1), Self::Database(d2)) => d1.to_string() == d2.to_string(),
            (Self::Serialization(s1), Self::Serialization(s2)) => s1.to_string() == s2.to_string(),
            _ => false,
        }
    }
}

impl Eq for PersistenceError {}
