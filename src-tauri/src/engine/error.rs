use crate::persistence::PersistenceError;

#[derive(thiserror::Error, Debug)]
pub enum EngineError {
    #[error("Persistence error: {0}")]
    Persistence(#[from] PersistenceError),

    #[error("No active timer is currently running")]
    NoActiveTimer,

    #[error("Another timer is already running for task '{active_task_id}'")]
    ActiveTimerConflict { active_task_id: String },

    #[error("{entity} with id '{id}' not found")]
    EntityNotFound { entity: &'static str, id: String },

    #[error("Parse time error: {0}")]
    ParseTime(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Operation failed: {0}")]
    OperationFailed(String),
}
