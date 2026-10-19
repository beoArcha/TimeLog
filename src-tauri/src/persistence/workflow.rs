use super::error::PersistenceResult;
use super::shared::PersistenceShared;
use crate::types::WorkflowConfig;
use std::sync::Arc;

pub struct WorkflowPersistence {
    shared: Arc<PersistenceShared>,
}

impl WorkflowPersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn get_config(&self) -> PersistenceResult<WorkflowConfig> {
        Ok(self.shared.config_repo.get_workflow_config()?)
    }

    pub fn save_config(&self, config: &WorkflowConfig) -> PersistenceResult<()> {
        self.shared.config_repo.save_workflow_config(config)?;
        Ok(())
    }
}
