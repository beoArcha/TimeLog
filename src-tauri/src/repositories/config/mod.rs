pub mod cli_aliases;
pub mod cli_sinks;
pub mod constants;
pub mod external_api;
pub mod locale;
pub mod runtime_config;
pub mod settings;
pub mod ui_state;
pub mod webhook_queue;
pub mod workflow;

use crate::repositories::shared::errors::Result;
use crate::repositories::shared::{establish_connection, initialize_database};
use rusqlite::Connection;
use std::path::{Path, PathBuf};

pub struct ConfigRepository {
    db_path: PathBuf,
}

impl ConfigRepository {
    pub fn new(db_path: &Path) -> Result<Self> {
        let repo = Self {
            db_path: db_path.to_path_buf(),
        };
        let conn = repo.connect()?;
        initialize_database(&conn)?;
        Ok(repo)
    }

    fn connect(&self) -> Result<Connection> {
        establish_connection(&self.db_path)
    }

    pub(crate) fn query_config_value(conn: &Connection, key: &str) -> Result<Option<String>> {
        let mut stmt = conn.prepare(constants::SELECT_CONFIG_VALUE)?;
        let mut rows = stmt.query(rusqlite::params![key])?;
        if let Some(row) = rows.next()? {
            let val: String = row.get(0)?;
            Ok(Some(val))
        } else {
            Ok(None)
        }
    }

    pub(crate) fn store_config_value(conn: &Connection, key: &str, value: &str) -> Result<()> {
        conn.execute(
            constants::INSERT_OR_REPLACE_CONFIG,
            rusqlite::params![key, value],
        )?;
        Ok(())
    }
}
