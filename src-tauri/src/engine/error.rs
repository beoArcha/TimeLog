use crate::persistence::PersistenceError;

#[derive(thiserror::Error, Debug)]
pub enum EngineError {
    #[error("Persistence error: {0}")]
    Persistence(#[from] PersistenceError),
    #[error("Parse time error: {0}")]
    ParseTime(String),
    #[error("Validation error: {0}")]
    Validation(String),
}
