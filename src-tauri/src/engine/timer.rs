use super::{Engine, EngineError};
use chrono::Utc;

static LOG_COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);

fn should_close_other_project(
    persistence: &crate::persistence::Persistence,
    active_task_id: &str,
    current_proj_id: &str,
) -> Result<Option<String>, EngineError> {
    let other_proj_id = match persistence.tasks.get_project_id(active_task_id) {
        Ok(id) if id != current_proj_id => id,
        _ => return Ok(None),
    };
    let other_proj = persistence.projects.get(&other_proj_id)?;
    let allows_concurrency = other_proj
        .and_then(|p| p.allow_concurrency)
        .unwrap_or(false);
    if allows_concurrency {
        Ok(None)
    } else {
        Ok(Some(other_proj_id))
    }
}

impl<'a> Engine<'a> {
    pub fn start_timer(&self, task_id: &str) -> Result<(), EngineError> {
        let proj_id = self.persistence.tasks.get_project_id(task_id)?;

        let now = Utc::now().to_rfc3339();
        self.persistence
            .time_logs
            .close_active_by_project(&now, &proj_id)?;

        let current_proj = self.persistence.projects.get(&proj_id)?;
        let allows_concurrency = current_proj
            .and_then(|p| p.allow_concurrency)
            .unwrap_or(false);

        if !allows_concurrency {
            let active_tasks = self.persistence.time_logs.query_active()?;
            for active_task in active_tasks {
                if let Ok(Some(other_proj_id)) =
                    should_close_other_project(self.persistence, &active_task, &proj_id)
                {
                    self.persistence
                        .time_logs
                        .close_active_by_project(&now, &other_proj_id)?;
                }
            }
        }

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

    pub fn edit_log(
        &self,
        log_id: &str,
        new_task_id: &str,
        new_start_time: &str,
        new_end_time: Option<&str>,
        new_note: Option<&str>,
        reason: Option<crate::types::AuditSource>,
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

        let entry = crate::types::TimeLogUpdateHistory {
            id: log_id,
            task_id: new_task_id,
            start_time: new_start_time,
            end_time: new_end_time,
            note: new_note,
            history_id: &history_id,
            edited_at: &edited_at,
            prev_start_time: prev_start,
            prev_end_time: prev_end,
            prev_note,
            reason,
        };

        self.persistence.time_logs.update_with_history(&entry)?;

        Ok(())
    }

    pub fn get_state(&self) -> Result<crate::types::TimerRepositoryState, EngineError> {
        let projects = self.persistence.projects.get_all()?;
        let tasks = self.persistence.tasks.get_all()?;
        let logs = self.persistence.time_logs.get_all()?;

        let active_task_ids = self.persistence.time_logs.query_active()?;
        let active_logs: Vec<crate::types::TimeLog> = logs
            .iter()
            .filter(|l| l.end_time.is_none() && active_task_ids.contains(&l.task_id))
            .cloned()
            .collect();
        let active_log = active_logs.first().cloned();

        Ok(crate::types::TimerRepositoryState {
            projects,
            tasks,
            logs,
            active_log,
            active_logs: Some(active_logs),
        })
    }
}
