use std::sync::Arc;
use super::persistence_shared::PersistenceShared;
use super::error::PersistenceResult;
use crate::types::TimeLog;

pub struct CorePersistence {
    shared: Arc<PersistenceShared>,
}

impl CorePersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn get_time_logs_for_task(&self, task_id: &str) -> PersistenceResult<Vec<TimeLog>> {
        if let Some(logs) = self.shared.cache.get_time_logs_for_task(task_id) {
            return Ok(logs);
        }
        let logs = self.shared.business_repo.get_time_logs_for_task(task_id)?;
        self.shared.cache
            .insert_time_logs_for_task(task_id.to_string(), logs.clone());
        Ok(logs)
    }

    pub fn close_active_logs_by_project(
        &self,
        end_time: &str,
        project_id: &str,
    ) -> PersistenceResult<()> {
        self.shared.business_repo
            .close_active_logs_by_project(end_time, project_id)?;
        self.shared.cache.clear();
        Ok(())
    }

    pub fn close_all_active_logs(&self, end_time: &str) -> PersistenceResult<()> {
        self.shared.business_repo.close_all_active_logs(end_time)?;
        self.shared.cache.clear();
        Ok(())
    }

    pub fn insert_time_log(
        &self,
        log_id: &str,
        task_id: &str,
        start_time: &str,
    ) -> PersistenceResult<()> {
        self.shared.business_repo
            .insert_time_log(log_id, task_id, start_time)?;
        self.shared.cache.clear();
        Ok(())
    }

    pub fn query_active_logs(&self) -> PersistenceResult<Vec<String>> {
        Ok(self.shared.business_repo.query_active_logs()?)
    }

    pub fn get_all_time_logs(&self) -> PersistenceResult<Vec<TimeLog>> {
        Ok(self.shared.business_repo.get_all_time_logs()?)
    }

    pub fn clear_all_data(&self) -> PersistenceResult<()> {
        self.shared.business_repo.clear_all_data()?;
        self.shared.cache.clear();
        Ok(())
    }
}
