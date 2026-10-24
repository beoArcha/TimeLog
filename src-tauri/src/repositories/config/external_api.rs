use super::constants;
use super::ConfigRepository;
use crate::repositories::shared::errors::Result;
use crate::types::ExternalApiSettings;

impl ConfigRepository {
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
}
