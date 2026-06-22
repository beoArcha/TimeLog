use super::constants;
use super::ConfigRepository;
use crate::repositories::shared::errors::Result;
use crate::types::{Settings, SinkType};
use rusqlite::{params, Connection};

impl ConfigRepository {
    fn get_value(&self, conn: &Connection, key: &str) -> Result<Option<String>> {
        let mut stmt = conn.prepare(constants::SELECT_CONFIG_VALUE)?;
        let mut rows = stmt.query(params![key])?;
        if let Some(row) = rows.next()? {
            let val: String = row.get(0)?;
            Ok(Some(val))
        } else {
            Ok(None)
        }
    }

    fn set_value(&self, conn: &Connection, key: &str, value: &str) -> Result<()> {
        conn.execute(constants::INSERT_OR_REPLACE_CONFIG, params![key, value])?;
        Ok(())
    }

    pub fn get_config(&self) -> Result<Settings> {
        let conn = self.connect()?;
        let mut keys_changed = false;
        let default_settings = Settings::default();

        let auto_start = match self.get_value(&conn, "auto_start")? {
            Some(v) => v.parse::<bool>().unwrap_or_else(|_| {
                keys_changed = true;
                default_settings.auto_start
            }),
            None => {
                keys_changed = true;
                default_settings.auto_start
            }
        };

        let auto_pause_on_sleep = match self.get_value(&conn, "auto_pause_on_sleep")? {
            Some(v) => v.parse::<bool>().unwrap_or_else(|_| {
                keys_changed = true;
                default_settings.auto_pause_on_sleep
            }),
            None => {
                keys_changed = true;
                default_settings.auto_pause_on_sleep
            }
        };

        let include_patches_in_reports =
            match self.get_value(&conn, "include_patches_in_reports")? {
                Some(v) => v.parse::<bool>().unwrap_or_else(|_| {
                    keys_changed = true;
                    default_settings.include_patches_in_reports
                }),
                None => {
                    keys_changed = true;
                    default_settings.include_patches_in_reports
                }
            };

        let active_sinks = match self.get_value(&conn, "active_sinks")? {
            Some(v) => serde_json::from_str::<Vec<SinkType>>(&v).unwrap_or_else(|_| {
                keys_changed = true;
                default_settings.active_sinks.clone()
            }),
            None => {
                keys_changed = true;
                default_settings.active_sinks.clone()
            }
        };

        let settings = Settings {
            auto_start,
            auto_pause_on_sleep,
            include_patches_in_reports,
            active_sinks,
        };

        if keys_changed {
            self.save_config_with_conn(&conn, &settings)?;
        }

        Ok(settings)
    }

    pub fn save_config(&self, settings: &Settings) -> Result<()> {
        let conn = self.connect()?;
        self.save_config_with_conn(&conn, settings)
    }

    fn save_config_with_conn(&self, conn: &Connection, settings: &Settings) -> Result<()> {
        self.set_value(conn, "auto_start", &settings.auto_start.to_string())?;
        self.set_value(
            conn,
            "auto_pause_on_sleep",
            &settings.auto_pause_on_sleep.to_string(),
        )?;
        self.set_value(
            conn,
            "include_patches_in_reports",
            &settings.include_patches_in_reports.to_string(),
        )?;
        let active_sinks_str = serde_json::to_string(&settings.active_sinks)?;
        self.set_value(conn, "active_sinks", &active_sinks_str)?;
        Ok(())
    }
}
