use super::error::PersistenceResult;
use super::shared::PersistenceShared;
use std::sync::Arc;

pub struct UiStatePersistence {
    shared: Arc<PersistenceShared>,
}

impl UiStatePersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn get_current_project_id(&self) -> PersistenceResult<Option<String>> {
        Ok(self.shared.config_repo.get_current_project_id()?)
    }

    pub fn save_current_project_id(&self, id: Option<String>) -> PersistenceResult<()> {
        self.shared
            .config_repo
            .save_current_project_id(id.as_deref())?;
        Ok(())
    }

    pub fn get_last_non_compact_variant(&self) -> PersistenceResult<String> {
        Ok(self.shared.config_repo.get_last_non_compact_variant()?)
    }

    pub fn save_last_non_compact_variant(&self, variant: String) -> PersistenceResult<()> {
        self.shared
            .config_repo
            .save_last_non_compact_variant(&variant)?;
        Ok(())
    }

    pub fn get_project_order(&self) -> PersistenceResult<Vec<String>> {
        Ok(self.shared.config_repo.get_project_order()?)
    }

    pub fn save_project_order(&self, order: Vec<String>) -> PersistenceResult<()> {
        self.shared.config_repo.save_project_order(&order)?;
        Ok(())
    }
}
