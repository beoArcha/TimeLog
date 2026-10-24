pub mod constants;
pub mod debug;
pub mod holidays;
pub mod override_state;
pub mod patches;
pub mod projects;
pub mod tasks;
pub mod time_logs;

use crate::repositories::shared::errors::{RepositoryError, Result};
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

    pub fn get_db_path(&self) -> &Path {
        &self.db_path
    }

    pub fn check_integrity(&self) -> Result<String> {
        let conn = self.connect()?;
        let result: String = conn.query_row("PRAGMA integrity_check", [], |row| row.get(0))?;
        Ok(result)
    }

    pub fn backup_database(&self, destination_path: &Path) -> Result<()> {
        let conn = self.connect()?;
        if destination_path.exists() {
            std::fs::remove_file(destination_path).map_err(|e| {
                RepositoryError::Storage(format!("Failed to overwrite existing backup file: {e}"))
            })?;
        }
        let dest_str = destination_path.to_str().ok_or_else(|| {
            RepositoryError::Validation("Destination path is not valid UTF-8".to_string())
        })?;
        conn.execute("VACUUM INTO ?1", rusqlite::params![dest_str])?;
        Ok(())
    }

    pub fn restore_database(&self, source_path: &Path) -> Result<()> {
        if !source_path.exists() {
            return Err(RepositoryError::NotFound {
                entity: "backup_file",
                id: source_path.display().to_string(),
            });
        }
        let source_conn = establish_connection(source_path)?;
        let check: String =
            source_conn.query_row("PRAGMA integrity_check", [], |row| row.get(0))?;
        if check != "ok" {
            return Err(RepositoryError::Storage(format!(
                "Backup file corrupted: integrity check returned '{check}'"
            )));
        }

        let mut live_conn = self.connect()?;
        let backup = rusqlite::backup::Backup::new(&source_conn, &mut live_conn)?;
        backup.run_to_completion(100, std::time::Duration::from_millis(50), None)?;
        Ok(())
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
