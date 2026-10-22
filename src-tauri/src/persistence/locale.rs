use super::error::PersistenceResult;
use super::shared::PersistenceShared;
use std::sync::Arc;

pub struct LocalePersistence {
    shared: Arc<PersistenceShared>,
}

impl LocalePersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
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
