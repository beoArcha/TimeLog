use super::error::PersistenceResult;
use super::shared::PersistenceShared;
use crate::types::ExternalApiSettings;
use std::sync::Arc;

pub struct ExternalApiPersistence {
    shared: Arc<PersistenceShared>,
}

impl ExternalApiPersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn get_external_api_settings(&self) -> PersistenceResult<ExternalApiSettings> {
        Ok(self.shared.config_repo.get_external_api_settings()?)
    }

    pub fn save_external_api_settings(
        &self,
        settings: ExternalApiSettings,
    ) -> PersistenceResult<()> {
        self.shared
            .config_repo
            .save_external_api_settings(&settings)?;
        Ok(())
    }
}
