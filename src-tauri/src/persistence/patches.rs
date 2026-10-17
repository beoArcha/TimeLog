use super::error::PersistenceResult;
use super::shared::PersistenceShared;
use crate::types::PatchLog;
use std::sync::Arc;

pub struct PatchesPersistence {
    shared: Arc<PersistenceShared>,
}

impl PatchesPersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn get_all(&self) -> PersistenceResult<Vec<PatchLog>> {
        Ok(self.shared.business_repo.get_all_patches()?)
    }

    pub fn save(&self, patches: Vec<PatchLog>) -> PersistenceResult<()> {
        self.shared.business_repo.save_patches(&patches)?;
        self.shared.cache.clear();
        Ok(())
    }
}
