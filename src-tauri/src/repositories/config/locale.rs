use super::constants;
use super::ConfigRepository;
use crate::repositories::shared::errors::Result;

impl ConfigRepository {
    pub fn get_locale_pref(&self) -> Result<String> {
        let conn = self.connect()?;
        let val = Self::query_config_value(&conn, constants::KEY_LOCALE_PREF)?;
        Ok(val.unwrap_or_else(|| constants::DEFAULT_LOCALE.to_string()))
    }

    pub fn save_locale_pref(&self, pref: &str) -> Result<()> {
        let conn = self.connect()?;
        Self::store_config_value(&conn, constants::KEY_LOCALE_PREF, pref)
    }

    pub fn get_locale(&self) -> Result<String> {
        let conn = self.connect()?;
        let val = Self::query_config_value(&conn, constants::KEY_LOCALE)?;
        Ok(val.unwrap_or_else(|| constants::DEFAULT_LOCALE.to_string()))
    }

    pub fn save_locale(&self, locale: &str) -> Result<()> {
        let conn = self.connect()?;
        Self::store_config_value(&conn, constants::KEY_LOCALE, locale)
    }

    pub fn get_custom_translations(&self) -> Result<String> {
        let conn = self.connect()?;
        let val = Self::query_config_value(&conn, constants::KEY_CUSTOM_TRANSLATIONS)?;
        Ok(val.unwrap_or_else(|| constants::DEFAULT_CUSTOM_TRANSLATIONS.to_string()))
    }

    pub fn save_custom_translations(&self, json_str: &str) -> Result<()> {
        let conn = self.connect()?;
        Self::store_config_value(&conn, constants::KEY_CUSTOM_TRANSLATIONS, json_str)
    }
}
