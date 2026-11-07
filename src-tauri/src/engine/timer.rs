use super::{Engine, EngineError};
use chrono::Utc;

static LOG_COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);

impl<'a> Engine<'a> {
    pub fn start_timer(&self, task_id: &str) -> Result<(), EngineError> {
        let now = Utc::now().to_rfc3339();
        let log_id = format!(
            "log_{}_{}",
            Utc::now().timestamp_millis(),
            LOG_COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst)
        );

        self.persistence
            .time_logs
            .start_active(&now, &log_id, task_id, &now)?;
        Ok(())
    }

    pub fn stop_timer(&self, project_id: Option<&str>) -> Result<(), EngineError> {
        let now = Utc::now().to_rfc3339();
        let affected = match project_id {
            Some(p_id) => self
                .persistence
                .time_logs
                .close_active_by_project(&now, p_id)?,
            None => self.persistence.time_logs.close_all_active(&now)?,
        };

        if affected == 0 {
            return Err(EngineError::NoActiveTimer);
        }

        Ok(())
    }

    pub fn switch_timer(&self, target_task_id: &str) -> Result<(), EngineError> {
        // Validate target task existence before touching active timers
        let _ = self.persistence.tasks.get_project_id(target_task_id)?;

        let now = Utc::now().to_rfc3339();
        let log_id = format!(
            "log_{}_{}",
            Utc::now().timestamp_millis(),
            LOG_COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst)
        );

        self.persistence
            .time_logs
            .switch_active(&now, &log_id, target_task_id, &now)?;
        Ok(())
    }

    pub fn get_active_logs(&self) -> Result<Vec<String>, EngineError> {
        let ids = self.persistence.time_logs.query_active()?;
        Ok(ids)
    }

    pub fn edit_log(&self, input: crate::types::TimeLogEditInput<'_>) -> Result<(), EngineError> {
        let current_log = self.persistence.time_logs.get_by_id(input.id)?;

        self.validate_time_log(input.id, input.task_id, input.start_time, input.end_time)?;

        let resolved_source = input
            .audit_source
            .unwrap_or(crate::types::AuditSource::GuiEdit);

        let trimmed_reason = input.reason.map(|r| r.trim()).filter(|r| !r.is_empty());

        if resolved_source.requires_reason() && trimmed_reason.is_none() {
            return Err(EngineError::Validation(
                "Audit reason is required for manual edits".to_string(),
            ));
        }

        let prev_start = if current_log.start_time != input.start_time {
            Some(current_log.start_time.as_str())
        } else {
            None
        };
        let prev_end = if current_log.end_time.as_deref() != input.end_time {
            current_log.end_time.as_deref()
        } else {
            None
        };
        let prev_note = if current_log.note.as_deref() != input.note {
            current_log.note.as_deref()
        } else {
            None
        };

        let history_id = format!("history_{}", uuid::Uuid::new_v4());
        let edited_at = Utc::now().to_rfc3339();

        let entry = crate::types::TimeLogUpdateHistory {
            id: input.id,
            task_id: input.task_id,
            start_time: input.start_time,
            end_time: input.end_time,
            note: input.note,
            history_id: &history_id,
            edited_at: &edited_at,
            prev_start_time: prev_start,
            prev_end_time: prev_end,
            prev_note,
            reason: trimmed_reason,
            audit_source: Some(resolved_source),
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
