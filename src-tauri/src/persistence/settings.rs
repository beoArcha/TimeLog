use super::error::PersistenceResult;
use super::shared::PersistenceShared;
use crate::types::{RuntimeConfig, Settings};
use std::sync::Arc;

pub struct SettingsPersistence {
    shared: Arc<PersistenceShared>,
}

impl SettingsPersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn get(&self) -> PersistenceResult<Settings> {
        let config = self.shared.config_repo.get_config()?;
        Ok(config)
    }

    pub fn save(&self, settings: Settings) -> PersistenceResult<()> {
        self.shared.config_repo.save_config(&settings)?;
        Ok(())
    }

    pub fn save_runtime_config(&self, config: RuntimeConfig) -> PersistenceResult<()> {
        self.shared.config_repo.save_runtime_config(&config)?;
        Ok(())
    }

    pub fn get_runtime_configs(&self) -> PersistenceResult<Vec<RuntimeConfig>> {
        let configs = self.shared.config_repo.get_runtime_configs()?;
        Ok(configs)
    }
}
