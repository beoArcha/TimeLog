use super::{Engine, EngineError};
use chrono::{DateTime, Utc};

impl<'a> Engine<'a> {
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
