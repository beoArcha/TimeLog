pub mod constants;
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
}
