use super::constants;
use super::ConfigRepository;
use crate::repositories::shared::errors::Result;
use rusqlite::params;

impl ConfigRepository {
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

    pub fn get_project_order(&self) -> Result<Vec<String>> {
        let conn = self.connect()?;
        let val = Self::query_config_value(&conn, constants::KEY_PROJECT_ORDER)?;
        match val {
            Some(json_str) => Ok(serde_json::from_str(&json_str)?),
            None => Ok(Vec::new()),
        }
    }

    pub fn save_project_order(&self, order: &[String]) -> Result<()> {
        let conn = self.connect()?;
        let json_str = serde_json::to_string(order)?;
        Self::store_config_value(&conn, constants::KEY_PROJECT_ORDER, &json_str)
    }

    pub fn get_last_tracked_task_id(&self) -> Result<Option<String>> {
        let conn = self.connect()?;
        Self::query_config_value(&conn, constants::KEY_LAST_TRACKED_TASK_ID)
    }

    pub fn save_last_tracked_task_id(&self, id: Option<&str>) -> Result<()> {
        let conn = self.connect()?;
        if let Some(val) = id {
            Self::store_config_value(&conn, constants::KEY_LAST_TRACKED_TASK_ID, val)?;
        } else {
            conn.execute(
                constants::DELETE_CONFIG_KEY,
                params![constants::KEY_LAST_TRACKED_TASK_ID],
            )?;
        }
        Ok(())
    }
}
