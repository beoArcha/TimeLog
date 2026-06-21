use crate::engine::constants;
use rusqlite::{params, Connection, Result};

pub fn init_db(db_path: &std::path::Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    init_db_conn(conn)
}

#[allow(dead_code)]
pub fn init_db_in_memory() -> Result<Connection> {
    let conn = Connection::open_in_memory()?;
    init_db_conn(conn)
}

fn init_db_conn(conn: Connection) -> Result<Connection> {
    let _ = conn.pragma_update(None, "journal_mode", constants::PRAGMA_JOURNAL_MODE_WAL);
    let _ = conn.pragma_update(None, "foreign_keys", constants::PRAGMA_FOREIGN_KEYS_ON);

    conn.execute(constants::CREATE_PROJECTS_TABLE, [])?;
    conn.execute(constants::CREATE_TASKS_TABLE, [])?;
    conn.execute(constants::CREATE_TIME_LOGS_TABLE, [])?;

    Ok(conn)
}

#[allow(dead_code)]
pub struct DataManager {
    pub conn: Connection,
}

#[allow(dead_code)]
impl DataManager {
    pub fn new(db_path: &std::path::Path) -> Result<Self> {
        let conn = init_db(db_path)?;
        Ok(Self { conn })
    }

    pub fn new_in_memory() -> Result<Self> {
        let conn = init_db_in_memory()?;
        Ok(Self { conn })
    }

    pub fn insert_project(
        &self,
        id: &str,
        name: &str,
        color: &str,
        created_at: &str,
    ) -> Result<usize> {
        self.conn.execute(
            constants::INSERT_PROJECT,
            params![id, name, color, created_at],
        )
    }

    pub fn insert_task(
        &self,
        id: &str,
        project_id: &str,
        name: &str,
        completed: bool,
        created_at: &str,
    ) -> Result<usize> {
        self.conn.execute(
            constants::INSERT_TASK,
            params![id, project_id, name, completed as i32, created_at],
        )
    }
}
