use super::error::PersistenceResult;
use super::shared::PersistenceShared;
use crate::types::TimeLog;
use std::sync::Arc;

pub struct TimeLogsPersistence {
    shared: Arc<PersistenceShared>,
}

impl TimeLogsPersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn get_for_task(&self, task_id: &str) -> PersistenceResult<Vec<TimeLog>> {
        if let Some(logs) = self.shared.cache.get_time_logs_for_task(task_id) {
            return Ok(logs);
        }
        let logs = self.shared.business_repo.get_time_logs_for_task(task_id)?;
        self.shared
            .cache
            .insert_time_logs_for_task(task_id.to_string(), logs.clone());
        Ok(logs)
    }

    pub fn close_active_by_project(
        &self,
        end_time: &str,
        project_id: &str,
    ) -> PersistenceResult<()> {
        self.shared
            .business_repo
            .close_active_logs_by_project(end_time, project_id)?;
        self.shared.cache.clear();
        Ok(())
    }

    pub fn close_all_active(&self, end_time: &str) -> PersistenceResult<()> {
        self.shared.business_repo.close_all_active_logs(end_time)?;
        self.shared.cache.clear();
        Ok(())
    }

    pub fn insert(&self, log_id: &str, task_id: &str, start_time: &str) -> PersistenceResult<()> {
        self.shared
            .business_repo
            .insert_time_log(log_id, task_id, start_time)?;
        self.shared.cache.clear();
        Ok(())
    }

    pub fn query_active(&self) -> PersistenceResult<Vec<String>> {
        Ok(self.shared.business_repo.query_active_logs()?)
    }

    pub fn get_all(&self) -> PersistenceResult<Vec<TimeLog>> {
        Ok(self.shared.business_repo.get_all_time_logs()?)
    }

    pub fn get_by_id(&self, log_id: &str) -> PersistenceResult<TimeLog> {
        Ok(self.shared.business_repo.get_time_log_by_id(log_id)?)
    }

    pub fn update_with_history(
        &self,
        id: &str,
        task_id: &str,
        start_time: &str,
        end_time: Option<&str>,
        note: Option<&str>,
        history_id: &str,
        edited_at: &str,
        prev_start_time: Option<&str>,
        prev_end_time: Option<&str>,
        prev_note: Option<&str>,
        reason: Option<&str>,
    ) -> PersistenceResult<()> {
        self.shared.business_repo.update_time_log_with_history(
            id,
            task_id,
            start_time,
            end_time,
            note,
            history_id,
            edited_at,
            prev_start_time,
            prev_end_time,
            prev_note,
            reason,
        )?;
        self.shared.cache.clear();
        Ok(())
    }
}
