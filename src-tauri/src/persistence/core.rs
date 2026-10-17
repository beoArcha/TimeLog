use super::error::PersistenceResult;
use super::shared::PersistenceShared;
use std::sync::Arc;

pub struct CorePersistence {
    shared: Arc<PersistenceShared>,
}

impl CorePersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn clear_all_data(&self) -> PersistenceResult<()> {
        self.shared.business_repo.clear_all_data()?;
        self.shared.cache.clear();
        Ok(())
    }

    pub fn override_state(
        &self,
        projects: Option<Vec<crate::types::Project>>,
        tasks: Option<Vec<crate::types::Task>>,
        logs: Option<Vec<crate::types::TimeLog>>,
    ) -> PersistenceResult<()> {
        self.shared
            .business_repo
            .override_state(projects, tasks, logs)?;
        self.shared.cache.clear();
        Ok(())
    }
}
