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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_error_serialization() {
        let err = AppError::Generic("test error".to_string());
        let serialized = serde_json::to_string(&err).unwrap();
        assert_eq!(serialized, "\"Application error: test error\"");

        let db_err = AppError::Database(rusqlite::Error::QueryReturnedNoRows);
        let serialized_db = serde_json::to_string(&db_err).unwrap();
        assert!(serialized_db.contains("Database error:"));
    }
}
