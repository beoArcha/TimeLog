use std::sync::Arc;
use super::persistence_shared::PersistenceShared;
use super::error::PersistenceResult;
use crate::types::Settings;

pub struct SettingsPersistence {
    shared: Arc<PersistenceShared>,
}

impl SettingsPersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn get_settings(&self) -> PersistenceResult<Settings> {
        let config = self.shared.config_repo.get_config()?;
        Ok(config)
    }

    pub fn save_settings(&self, settings: Settings) -> PersistenceResult<()> {
        self.shared.config_repo.save_config(&settings)?;
        Ok(())
    }
}
