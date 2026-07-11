use crate::persistence::{Persistence, PersistenceError};
use chrono::{DateTime, Utc};
use std::time::Duration;

static LOG_COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);

#[derive(thiserror::Error, Debug)]
pub enum EngineError {
    #[error("Persistence error: {0}")]
    Persistence(#[from] PersistenceError),
    #[error("Parse time error: {0}")]
    ParseTime(String),
}

pub struct Engine<'a> {
    persistence: &'a Persistence,
}

impl<'a> Engine<'a> {
    pub fn new(persistence: &'a Persistence) -> Self {
        Self { persistence }
    }

    pub fn calculate_subtask_elapsed(&self, subtask_id: &str) -> Result<Duration, EngineError> {
        let logs = self.persistence.time_logs.get_for_task(subtask_id)?;
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
        let logs = self.persistence.time_logs.get_for_task(task_id)?;
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

        let subtasks = self.persistence.tasks.get_subtasks(task_id)?;
        for subtask in subtasks {
            total_duration += self.calculate_subtask_elapsed(&subtask.id)?;
        }

        Ok(total_duration)
    }

    pub fn calculate_project_elapsed(&self, project_id: &str) -> Result<Duration, EngineError> {
        let parent_tasks = self.persistence.projects.get_tasks(project_id)?;
        let mut total_duration = Duration::ZERO;

        for task in parent_tasks {
            total_duration += self.calculate_task_elapsed(&task.id)?;
        }

        Ok(total_duration)
    }

    pub fn start_timer(&self, task_id: &str) -> Result<(), EngineError> {
        let proj_id = self.persistence.tasks.get_project_id(task_id)?;

        let now = Utc::now().to_rfc3339();
        self.persistence
            .time_logs
            .close_active_by_project(&now, &proj_id)?;

        let log_id = format!(
            "log_{}_{}",
            Utc::now().timestamp_millis(),
            LOG_COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst)
        );

        self.persistence.time_logs.insert(&log_id, task_id, &now)?;
        Ok(())
    }

    pub fn stop_timer(&self, project_id: Option<&str>) -> Result<(), EngineError> {
        let now = Utc::now().to_rfc3339();
        match project_id {
            Some(p_id) => {
                self.persistence
                    .time_logs
                    .close_active_by_project(&now, p_id)?;
            }
            None => {
                self.persistence.time_logs.close_all_active(&now)?;
            }
        }
        Ok(())
    }

    pub fn get_active_logs(&self) -> Result<Vec<String>, EngineError> {
        let ids = self.persistence.time_logs.query_active()?;
        Ok(ids)
    }

    pub fn get_state(&self) -> Result<crate::types::TimerRepositoryState, EngineError> {
        let projects = self.persistence.projects.get_all()?;
        let tasks = self.persistence.tasks.get_all()?;
        let logs = self.persistence.time_logs.get_all()?;

        let active_task_ids = self.persistence.time_logs.query_active()?;
        let active_log = if !active_task_ids.is_empty() {
            logs.iter()
                .find(|l| l.end_time.is_none() && active_task_ids.contains(&l.task_id))
                .cloned()
        } else {
            None
        };

        Ok(crate::types::TimerRepositoryState {
            projects,
            tasks,
            logs,
            active_log,
        })
    }
}
