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

    #[error("Audit reason is required for manual edits")]
    AuditReasonRequired,

    #[error("Invalid audit source: '{0}'")]
    AuditSourceInvalid(String),

    #[error("End time cannot be before start time")]
    TimeLogInvalidRange,

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Cannot start timer on completed task '{0}'")]
    TaskAlreadyCompleted(String),

    #[error("Operation failed: {0}")]
    OperationFailed(String),

    #[error("Invalid timezone: '{0}'")]
    InvalidTimezone(String),

    #[error("Invalid range input: {0}")]
    InvalidRangeInput(String),
}

impl EngineError {
    pub const fn code(&self) -> &'static str {
        match self {
            Self::AuditReasonRequired => "ERR_AUDIT_REASON_REQUIRED",
            Self::AuditSourceInvalid(_) => "ERR_AUDIT_SOURCE_INVALID",
            Self::TimeLogInvalidRange => "ERR_TIMELOG_INVALID_RANGE",
            Self::TaskAlreadyCompleted(_) => "ERR_TASK_ALREADY_COMPLETED",
            Self::NoActiveTimer => "ENG_TIMER_INACTIVE",
            Self::ActiveTimerConflict { .. } => "ENG_TIMER_CONFLICT",
            Self::EntityNotFound { .. } => "DOM_ENTITY_NOT_FOUND",
            Self::ParseTime(_) => "DOM_INVALID_TIMESTAMP",
            Self::Validation(_) => "DOM_BUSINESS_VIOLATION",
            Self::OperationFailed(_) => "ENG_OPERATION_FAILED",
            Self::InvalidTimezone(_) => "DOM_INVALID_TIMEZONE",
            Self::InvalidRangeInput(_) => "DOM_INVALID_RANGE_INPUT",
            Self::Persistence(_) => "ENG_PERSISTENCE_ERROR",
        }
    }
}

impl PartialEq for EngineError {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (Self::NoActiveTimer, Self::NoActiveTimer) => true,
            (Self::AuditReasonRequired, Self::AuditReasonRequired) => true,
            (Self::TimeLogInvalidRange, Self::TimeLogInvalidRange) => true,
            (Self::AuditSourceInvalid(s1), Self::AuditSourceInvalid(s2)) => s1 == s2,
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
            (Self::InvalidTimezone(t1), Self::InvalidTimezone(t2)) => t1 == t2,
            (Self::InvalidRangeInput(r1), Self::InvalidRangeInput(r2)) => r1 == r2,
            (Self::Persistence(p1), Self::Persistence(p2)) => p1 == p2,
            (Self::TaskAlreadyCompleted(t1), Self::TaskAlreadyCompleted(t2)) => t1 == t2,
            _ => false,
        }
    }
}

impl Eq for EngineError {}
