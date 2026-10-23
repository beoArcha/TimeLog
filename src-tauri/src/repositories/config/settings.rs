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

    fn parse_bool_value(key: &str, raw: &str) -> Result<bool> {
        raw.parse::<bool>().map_err(|_| {
            crate::repositories::shared::errors::RepositoryError::Validation(format!(
                "Invalid boolean value for key '{key}': {raw}"
            ))
        })
    }

    pub fn get_config(&self) -> Result<Settings> {
        let conn = self.connect()?;
        let mut keys_changed = false;
        let default_settings = Settings::default();

        let auto_start = match self.get_value(&conn, "auto_start")? {
            Some(v) => Self::parse_bool_value("auto_start", &v)?,
            None => {
                keys_changed = true;
                default_settings.auto_start
            }
        };

        let include_patches_in_reports =
            match self.get_value(&conn, "include_patches_in_reports")? {
                Some(v) => Self::parse_bool_value("include_patches_in_reports", &v)?,
                None => {
                    keys_changed = true;
                    default_settings.include_patches_in_reports
                }
            };

        let active_sinks = match self.get_value(&conn, "active_sinks")? {
            Some(v) => serde_json::from_str::<Vec<SinkType>>(&v)?,
            None => {
                keys_changed = true;
                default_settings.active_sinks.clone()
            }
        };

        let theme = self.get_value(&conn, "theme")?;
        let text_and_icon_size = self.get_value(&conn, "text_and_icon_size")?;
        let gui_variant = self.get_value(&conn, "gui_variant")?;

        let always_on_top_small = match self.get_value(&conn, "always_on_top_small")? {
            Some(v) => Some(Self::parse_bool_value("always_on_top_small", &v)?),
            None => None,
        };
        let always_on_top_main = match self.get_value(&conn, "always_on_top_main")? {
            Some(v) => Some(Self::parse_bool_value("always_on_top_main", &v)?),
            None => None,
        };
        let minimize_to_tray = match self.get_value(&conn, "minimize_to_tray")? {
            Some(v) => Some(Self::parse_bool_value("minimize_to_tray", &v)?),
            None => None,
        };

        let settings = Settings {
            auto_start,
            include_patches_in_reports,
            active_sinks,
            theme,
            text_and_icon_size,
            gui_variant,
            always_on_top_small,
            always_on_top_main,
            minimize_to_tray,
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
            "include_patches_in_reports",
            &settings.include_patches_in_reports.to_string(),
        )?;
        let active_sinks_str = serde_json::to_string(&settings.active_sinks)?;
        self.set_value(conn, "active_sinks", &active_sinks_str)?;

        if let Some(ref t) = settings.theme {
            self.set_value(conn, "theme", t)?;
        }
        if let Some(ref s) = settings.text_and_icon_size {
            self.set_value(conn, "text_and_icon_size", s)?;
        }
        if let Some(ref g) = settings.gui_variant {
            self.set_value(conn, "gui_variant", g)?;
        }
        if let Some(a) = settings.always_on_top_small {
            self.set_value(conn, "always_on_top_small", &a.to_string())?;
        }
        if let Some(a) = settings.always_on_top_main {
            self.set_value(conn, "always_on_top_main", &a.to_string())?;
        }
        if let Some(m) = settings.minimize_to_tray {
            self.set_value(conn, "minimize_to_tray", &m.to_string())?;
        }

        Ok(())
    }

    pub fn get_all_config_entries(&self) -> Result<Vec<(String, String)>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_ALL_CONFIG_ENTRIES)?;
        let rows = stmt.query_map([], |row| {
            let key: String = row.get(0)?;
            let value: String = row.get(1)?;
            Ok((key, value))
        })?;

        let mut entries = Vec::new();
        for item in rows {
            entries.push(item?);
        }
        Ok(entries)
    }

    pub fn get_config_value(&self, key: &str) -> Result<Option<String>> {
        let conn = self.connect()?;
        self.get_value(&conn, key)
    }

    pub fn set_config_value(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.connect()?;
        self.set_value(&conn, key, value)
    }
}
