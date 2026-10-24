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

impl PartialEq for EngineError {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (Self::NoActiveTimer, Self::NoActiveTimer) => true,
            (
                Self::ActiveTimerConflict { active_task_id: a1 },
                Self::ActiveTimerConflict { active_task_id: a2 },
            ) => a1 == a2,
            (
                Self::EntityNotFound {
                    entity: e1,
                    id: id1,
                },
                Self::EntityNotFound {
                    entity: e2,
                    id: id2,
                },
            ) => e1 == e2 && id1 == id2,
            (Self::Validation(v1), Self::Validation(v2)) => v1 == v2,
            (Self::ParseTime(p1), Self::ParseTime(p2)) => p1 == p2,
            (Self::OperationFailed(o1), Self::OperationFailed(o2)) => o1 == o2,
            (Self::Persistence(p1), Self::Persistence(p2)) => p1 == p2,
            _ => false,
        }
    }
}

impl Eq for EngineError {}
