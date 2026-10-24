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

    pub fn get_db_path(&self) -> &std::path::Path {
        self.shared.business_repo.get_db_path()
    }

    pub fn check_integrity(&self) -> PersistenceResult<String> {
        Ok(self.shared.business_repo.check_integrity()?)
    }

    pub fn backup_database(&self, destination_path: &std::path::Path) -> PersistenceResult<()> {
        self.shared
            .business_repo
            .backup_database(destination_path)?;
        Ok(())
    }

    pub fn restore_database(&self, source_path: &std::path::Path) -> PersistenceResult<()> {
        self.shared.business_repo.restore_database(source_path)?;
        self.shared.cache.clear();
        Ok(())
    }
}
