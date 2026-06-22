use crate::persistence::{PersistenceError, PersistenceLayer};
use chrono::{DateTime, Utc};
use std::time::Duration;

#[derive(thiserror::Error, Debug)]
pub enum EngineError {
    #[error("Persistence error: {0}")]
    Persistence(#[from] PersistenceError),
    #[error("Parse time error: {0}")]
    ParseTime(String),
}

pub struct Engine<'a> {
    persistence: &'a PersistenceLayer,
}

impl<'a> Engine<'a> {
    pub fn new(persistence: &'a PersistenceLayer) -> Self {
        Self { persistence }
    }

    pub fn calculate_subtask_elapsed(&self, subtask_id: &str) -> Result<Duration, EngineError> {
        let logs = self.persistence.get_time_logs_for_task(subtask_id)?;
        let mut total_duration = Duration::ZERO;

        for log in logs {
            let start = DateTime::parse_from_rfc3339(&log.start_time)
                .map_err(|e| EngineError::ParseTime(e.to_string()))?
                .with_timezone(&Utc);

            let end = match log.end_time {
                Some(ref end_str) => DateTime::parse_from_rfc3339(end_str)
                    .map_err(|e| EngineError::ParseTime(e.to_string()))?
                    .with_timezone(&Utc),
                None => Utc::now(),
            };

            if end >= start {
                let diff = end.signed_duration_since(start);
                total_duration += Duration::from_secs(diff.num_seconds() as u64);
            }
        }

        Ok(total_duration)
    }

    pub fn calculate_task_elapsed(&self, task_id: &str) -> Result<Duration, EngineError> {
        let logs = self.persistence.get_time_logs_for_task(task_id)?;
        let mut total_duration = Duration::ZERO;

        for log in logs {
            let start = DateTime::parse_from_rfc3339(&log.start_time)
                .map_err(|e| EngineError::ParseTime(e.to_string()))?
                .with_timezone(&Utc);

            let end = match log.end_time {
                Some(ref end_str) => DateTime::parse_from_rfc3339(end_str)
                    .map_err(|e| EngineError::ParseTime(e.to_string()))?
                    .with_timezone(&Utc),
                None => Utc::now(),
            };

            if end >= start {
                let diff = end.signed_duration_since(start);
                total_duration += Duration::from_secs(diff.num_seconds() as u64);
            }
        }

        let subtasks = self.persistence.get_subtasks_for_task(task_id)?;
        for subtask in subtasks {
            total_duration += self.calculate_subtask_elapsed(&subtask.id)?;
        }

        Ok(total_duration)
    }

    pub fn calculate_project_elapsed(&self, project_id: &str) -> Result<Duration, EngineError> {
        let parent_tasks = self.persistence.get_tasks_for_project(project_id)?;
        let mut total_duration = Duration::ZERO;

        for task in parent_tasks {
            total_duration += self.calculate_task_elapsed(&task.id)?;
        }

        Ok(total_duration)
    }
}
