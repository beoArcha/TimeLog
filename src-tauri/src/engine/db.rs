//! SQlite schema database definitions for Tauri v2 platform
use rusqlite::{Connection, Result, params};

pub fn init_db() -> Result<Connection> {
    let conn = Connection::open("oxytime.db")?;
    init_db_conn(conn)
}

pub fn init_db_in_memory() -> Result<Connection> {
    let conn = Connection::open_in_memory()?;
    init_db_conn(conn)
}

fn init_db_conn(conn: Connection) -> Result<Connection> {
    // Enable WAL mode & SQLite optimizations. 
    // We handle PRAGMA journal_mode carefully or ignore its result completely
    let _ = conn.execute("PRAGMA foreign_keys = ON", []);
    let _ = conn.query_row("PRAGMA journal_mode = WAL", [], |row| row.get::<_, String>(0));

    // Create projects, tasks, and concurrent timer logs structure
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL,
            created_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            parent_task_id TEXT,
            name TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY(parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
         );
         CREATE TABLE IF NOT EXISTS time_logs (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
         );"
    )?;

    Ok(conn)
}

pub struct DataManager {
    conn: Connection,
}

impl DataManager {
    pub fn new() -> Result<Self> {
        let conn = init_db()?;
        Ok(Self { conn })
    }

    pub fn new_in_memory() -> Result<Self> {
        let conn = init_db_in_memory()?;
        Ok(Self { conn })
    }

    pub fn insert_project(&self, id: &str, name: &str, color: &str, created_at: &str) -> Result<usize> {
        self.conn.execute(
            "INSERT INTO projects (id, name, color, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, name, color, created_at],
        )
    }

    pub fn insert_task(&self, id: &str, project_id: &str, name: &str, completed: bool, created_at: &str) -> Result<usize> {
        self.conn.execute(
            "INSERT INTO tasks (id, project_id, name, completed, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, project_id, name, completed as i32, created_at],
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_data_manager_creation() -> Result<()> {
        let manager = DataManager::new_in_memory();
        match &manager {
            Ok(_) => println!("OK"),
            Err(e) => println!("DB error: {:?}", e),
        }
        assert!(manager.is_ok(), "Data manager should initialize sqlite connection");
        Ok(())
    }

    #[test]
    fn test_data_manager_insert_project() -> Result<()> {
        let manager = DataManager::new_in_memory();
        println!("manager is_ok = {:?}", manager.is_ok());
        let manager = manager.unwrap();
        
        let res = manager.insert_project("1", "TestProj", "red", "2026-06-15T12:00:00Z");
        println!("insert = {:?}", res);
        assert!(res.is_ok());
        Ok(())
    }
}
