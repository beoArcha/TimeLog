pub mod constants;
pub mod debug;
pub mod holidays;
pub mod override_state;
pub mod patches;
pub mod projects;
pub mod tasks;
pub mod time_logs;

use crate::repositories::shared::errors::Result;
use crate::repositories::shared::{establish_connection, initialize_database};
use rusqlite::Connection;
use std::path::{Path, PathBuf};

pub struct BusinessRepository {
    db_path: PathBuf,
}

impl BusinessRepository {
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

    pub fn debug_get_tables(&self) -> Result<Vec<String>> {
        let conn = self.connect()?;
        debug::get_tables(&conn)
    }

    pub fn debug_get_table_rows(
        &self,
        table: &str,
        limit: u32,
        offset: u32,
    ) -> Result<debug::TableRowsResponse> {
        let conn = self.connect()?;
        debug::get_table_rows(&conn, table, limit, offset)
    }

    pub fn debug_update_cell(
        &self,
        table: &str,
        id_column: &str,
        id_value: &str,
        column: &str,
        new_value: &str,
    ) -> Result<()> {
        let conn = self.connect()?;
        debug::update_cell(&conn, table, id_column, id_value, column, new_value)
    }
}
