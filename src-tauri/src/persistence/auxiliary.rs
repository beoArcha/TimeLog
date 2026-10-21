use super::error::PersistenceResult;
use super::shared::PersistenceShared;
use crate::types::ExternalApiSettings;
use std::sync::Arc;

pub struct AuxiliaryPersistence {
    shared: Arc<PersistenceShared>,
}

impl AuxiliaryPersistence {
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

    pub fn get_locale_pref(&self) -> PersistenceResult<String> {
        Ok(self.shared.config_repo.get_locale_pref()?)
    }

    pub fn save_locale_pref(&self, pref: String) -> PersistenceResult<()> {
        self.shared.config_repo.save_locale_pref(&pref)?;
        Ok(())
    }

    pub fn get_locale(&self) -> PersistenceResult<String> {
        Ok(self.shared.config_repo.get_locale()?)
    }

    pub fn save_locale(&self, locale: String) -> PersistenceResult<()> {
        self.shared.config_repo.save_locale(&locale)?;
        Ok(())
    }

    pub fn get_custom_translations(&self) -> PersistenceResult<String> {
        Ok(self.shared.config_repo.get_custom_translations()?)
    }

    pub fn save_custom_translations(&self, json_str: String) -> PersistenceResult<()> {
        self.shared
            .config_repo
            .save_custom_translations(&json_str)?;
        Ok(())
    }
}
