use super::constants;
use super::ConfigRepository;
use crate::repositories::shared::errors::Result;
use crate::types::ExternalApiSettings;
use rusqlite::{params, Connection};

impl ConfigRepository {
    pub(crate) fn query_config_value(conn: &Connection, key: &str) -> Result<Option<String>> {
        let mut stmt = conn.prepare(constants::SELECT_CONFIG_VALUE)?;
        let mut rows = stmt.query(params![key])?;
        if let Some(row) = rows.next()? {
            let val: String = row.get(0)?;
            Ok(Some(val))
        } else {
            Ok(None)
        }
    }

    pub(crate) fn store_config_value(conn: &Connection, key: &str, value: &str) -> Result<()> {
        conn.execute(constants::INSERT_OR_REPLACE_CONFIG, params![key, value])?;
        Ok(())
    }

    // UI state accessors
    pub fn get_current_project_id(&self) -> Result<Option<String>> {
        let conn = self.connect()?;
        Self::query_config_value(&conn, constants::KEY_CURRENT_PROJECT_ID)
    }

    pub fn save_current_project_id(&self, id: Option<&str>) -> Result<()> {
        let conn = self.connect()?;
        if let Some(val) = id {
            Self::store_config_value(&conn, constants::KEY_CURRENT_PROJECT_ID, val)?;
        } else {
            conn.execute(
                constants::DELETE_CONFIG_KEY,
                params![constants::KEY_CURRENT_PROJECT_ID],
            )?;
        }
        Ok(())
    }

    pub fn get_last_non_compact_variant(&self) -> Result<String> {
        let conn = self.connect()?;
        let val = Self::query_config_value(&conn, constants::KEY_LAST_NON_COMPACT_VARIANT)?;
        Ok(val.unwrap_or_else(|| constants::DEFAULT_NON_COMPACT_VARIANT.to_string()))
    }

    pub fn save_last_non_compact_variant(&self, variant: &str) -> Result<()> {
        let conn = self.connect()?;
        Self::store_config_value(&conn, constants::KEY_LAST_NON_COMPACT_VARIANT, variant)
    }

    // External API accessors
    pub fn get_external_api_settings(&self) -> Result<ExternalApiSettings> {
        let conn = self.connect()?;
        let log_to_api = Self::query_config_value(&conn, constants::KEY_API_LOG_TO_API)?
            .and_then(|v| v.parse::<bool>().ok())
            .unwrap_or(false);
        let api_token =
            Self::query_config_value(&conn, constants::KEY_API_TOKEN)?.unwrap_or_default();
        let api_url = Self::query_config_value(&conn, constants::KEY_API_URL)?.unwrap_or_default();
        let api_method = Self::query_config_value(&conn, constants::KEY_API_METHOD)?
            .unwrap_or_else(|| constants::DEFAULT_API_METHOD.to_string());
        let api_headers =
            Self::query_config_value(&conn, constants::KEY_API_HEADERS)?.unwrap_or_default();

        Ok(ExternalApiSettings {
            log_to_api,
            api_token,
            api_url,
            api_method,
            api_headers,
        })
    }

    pub fn save_external_api_settings(&self, settings: &ExternalApiSettings) -> Result<()> {
        let conn = self.connect()?;
        Self::store_config_value(
            &conn,
            constants::KEY_API_LOG_TO_API,
            &settings.log_to_api.to_string(),
        )?;
        Self::store_config_value(&conn, constants::KEY_API_TOKEN, &settings.api_token)?;
        Self::store_config_value(&conn, constants::KEY_API_URL, &settings.api_url)?;
        Self::store_config_value(&conn, constants::KEY_API_METHOD, &settings.api_method)?;
        Self::store_config_value(&conn, constants::KEY_API_HEADERS, &settings.api_headers)?;
        Ok(())
    }

    // Locale accessors
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
