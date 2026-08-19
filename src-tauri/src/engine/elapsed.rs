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
    #[error("Validation error: {0}")]
    Validation(String),
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

    pub fn calculate_elapsed_range(
        &self,
        filter: &crate::types::ElapsedRangeFilter,
    ) -> Result<Duration, EngineError> {
        let all_logs = self.persistence.time_logs.get_all()?;
        let now = Utc::now();

        let range_start = if let Some(ref s) = filter.from {
            Some(
                DateTime::parse_from_rfc3339(s)
                    .map_err(|e| EngineError::ParseTime(e.to_string()))?
                    .with_timezone(&Utc),
            )
        } else {
            None
        };

        let range_end = if let Some(ref e) = filter.to {
            Some(
                DateTime::parse_from_rfc3339(e)
                    .map_err(|e| EngineError::ParseTime(e.to_string()))?
                    .with_timezone(&Utc),
            )
        } else {
            None
        };


        let mut total_duration = Duration::ZERO;

        for log in all_logs {
            if let Some(ref target_task_id) = filter.task_id {
                if &log.task_id != target_task_id {
                    continue;
                }
            }
            if let Some(ref target_project_id) = filter.project_id {
                if &log.project_id != target_project_id {
                    continue;
                }
            }

            let start = DateTime::parse_from_rfc3339(&log.start_time)
                .map_err(|e| EngineError::ParseTime(e.to_string()))?
                .with_timezone(&Utc);

            let end = match log.end_time {
                Some(ref end_str) => DateTime::parse_from_rfc3339(end_str)
                    .map_err(|e| EngineError::ParseTime(e.to_string()))?
                    .with_timezone(&Utc),
                None => now,
            };

            let effective_start = match range_start {
                Some(rs) => std::cmp::max(start, rs),
                None => start,
            };

            let effective_end = match range_end {
                Some(re) => std::cmp::min(end, re),
                None => end,
            };

            if effective_end > effective_start {
                let diff = effective_end.signed_duration_since(effective_start);
                total_duration += Duration::from_secs(diff.num_seconds() as u64);
            }
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

    pub fn validate_time_log(
        &self,
        log_id: &str,
        _task_id: &str,
        start_time: &str,
        end_time: Option<&str>,
    ) -> Result<(), EngineError> {
        let start = DateTime::parse_from_rfc3339(start_time)
            .map_err(|e| EngineError::ParseTime(e.to_string()))?
            .with_timezone(&Utc);

        let end = match end_time {
            Some(e_str) => {
                let e = DateTime::parse_from_rfc3339(e_str)
                    .map_err(|e| EngineError::ParseTime(e.to_string()))?
                    .with_timezone(&Utc);
                if e < start {
                    return Err(EngineError::Validation(
                        "End time cannot be before start time".to_string(),
                    ));
                }
                e
            }
            None => Utc::now(),
        };

        if start > Utc::now() {
            return Err(EngineError::Validation(
                "Start time cannot be in the future".to_string(),
            ));
        }

        let all_logs = self.persistence.time_logs.get_all()?;

        for log in all_logs {
            if log.id == log_id {
                continue;
            }

            let log_start = DateTime::parse_from_rfc3339(&log.start_time)
                .map_err(|e| EngineError::ParseTime(e.to_string()))?
                .with_timezone(&Utc);

            let log_end = match log.end_time {
                Some(ref e_str) => DateTime::parse_from_rfc3339(e_str)
                    .map_err(|e| EngineError::ParseTime(e.to_string()))?
                    .with_timezone(&Utc),
                None => Utc::now(),
            };

            if start < log_end && log_start < end {
                return Err(EngineError::Validation(format!(
                    "Time log overlaps with an existing log (ID: {})",
                    log.id
                )));
            }
        }

        Ok(())
    }

    pub fn edit_log(
        &self,
        log_id: &str,
        new_task_id: &str,
        new_start_time: &str,
        new_end_time: Option<&str>,
        new_note: Option<&str>,
        reason: Option<&str>,
    ) -> Result<(), EngineError> {
        let current_log = self.persistence.time_logs.get_by_id(log_id)?;

        self.validate_time_log(log_id, new_task_id, new_start_time, new_end_time)?;

        let prev_start = if current_log.start_time != new_start_time {
            Some(current_log.start_time.as_str())
        } else {
            None
        };
        let prev_end = if current_log.end_time.as_deref() != new_end_time {
            current_log.end_time.as_deref()
        } else {
            None
        };
        let prev_note = if current_log.note.as_deref() != new_note {
            current_log.note.as_deref()
        } else {
            None
        };

        let history_id = format!("history_{}", Utc::now().timestamp_millis());
        let edited_at = Utc::now().to_rfc3339();

        self.persistence.time_logs.update_with_history(
            log_id,
            new_task_id,
            new_start_time,
            new_end_time,
            new_note,
            &history_id,
            &edited_at,
            prev_start,
            prev_end,
            prev_note,
            reason,
        )?;

        Ok(())
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

    pub fn get_project_statistics(
        &self,
        project_id: &str,
    ) -> Result<crate::types::ProjectStatistics, EngineError> {
        let elapsed = self.calculate_project_elapsed(project_id)?;
        let tasks = self.persistence.projects.get_tasks(project_id)?;

        let mut total_tasks = 0;
        let mut completed_tasks = 0;

        for task in &tasks {
            total_tasks += 1;
            if task.completed {
                completed_tasks += 1;
            }
            let subtasks = self.persistence.tasks.get_subtasks(&task.id)?;
            for subtask in subtasks {
                total_tasks += 1;
                if subtask.completed {
                    completed_tasks += 1;
                }
            }
        }

        Ok(crate::types::ProjectStatistics {
            total_duration_sec: elapsed.as_secs(),
            total_tasks,
            completed_tasks,
        })
    }

    pub fn validate_task_hierarchy(
        &self,
        task_id: Option<&str>,
        parent_task_id: Option<&str>,
    ) -> Result<(), EngineError> {
        if let Some(p_id) = parent_task_id {
            if let Some(t_id) = task_id {
                if t_id == p_id {
                    return Err(EngineError::Validation(
                        "Task cannot be its own parent".to_string(),
                    ));
                }
            }
            if let Some(parent) = self.persistence.tasks.get(p_id)? {
                if parent.parent_task_id.is_some() {
                    return Err(EngineError::Validation(
                        "Cannot nest tasks more than one level deep".to_string(),
                    ));
                }
            }
            if let Some(t_id) = task_id {
                let subtasks = self.persistence.tasks.get_subtasks(t_id)?;
                if !subtasks.is_empty() {
                    return Err(EngineError::Validation(
                        "Cannot set a parent for a task that already has subtasks".to_string(),
                    ));
                }
            }
        }
        Ok(())
    }
}
