//! SQlite schema database definitions for Tauri v2 platform
use rusqlite::{Connection, Result, params};

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
    // Enable WAL mode & SQLite optimizations via pragma_update
    let _ = conn.pragma_update(None, "journal_mode", "WAL");
    let _ = conn.pragma_update(None, "foreign_keys", "ON");

    // Create projects, tasks, and concurrent timer logs structure
    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL,
            created_at TEXT NOT NULL
         )",
        [],
    )?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            parent_task_id TEXT,
            name TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY(parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
         )",
        [],
    )?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS time_logs (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
         )",
        [],
    )?;

    Ok(conn)
}

#[allow(dead_code)]
pub struct DataManager {
    conn: Connection,
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

    #[test]
    fn test_duplicate_project_name_fails() -> Result<()> {
        let manager = DataManager::new_in_memory()?;
        let now = "2026-06-15T12:00:00Z";
        
        assert!(manager.insert_project("1", "DuplicateProj", "red", now).is_ok());
        assert!(manager.insert_project("2", "DuplicateProj", "blue", now).is_err());
        Ok(())
    }

    #[test]
    fn test_foreign_key_constraints() -> Result<()> {
        let manager = DataManager::new_in_memory()?;
        let now = "2026-06-15T12:00:00Z";
        
        assert!(manager.insert_task("t1", "999", "Invalid Task", false, now).is_err());
        Ok(())
    }

    #[test]
    fn test_cascade_delete() -> Result<()> {
        let manager = DataManager::new_in_memory()?;
        let now = "2026-06-15T12:00:00Z";
        
        manager.insert_project("p1", "Proj1", "red", now)?;
        manager.insert_task("t1", "p1", "Task1", false, now)?;
        
        manager.conn.execute(
            "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES ('l1', 't1', ?, NULL)",
            params![now]
        )?;

        let task_count: i64 = manager.conn.query_row("SELECT COUNT(*) FROM tasks", [], |r| r.get(0))?;
        let log_count: i64 = manager.conn.query_row("SELECT COUNT(*) FROM time_logs", [], |r| r.get(0))?;
        assert_eq!(task_count, 1);
        assert_eq!(log_count, 1);

        manager.conn.execute("DELETE FROM projects WHERE id = 'p1'", [])?;

        let task_count_after: i64 = manager.conn.query_row("SELECT COUNT(*) FROM tasks", [], |r| r.get(0))?;
        let log_count_after: i64 = manager.conn.query_row("SELECT COUNT(*) FROM time_logs", [], |r| r.get(0))?;
        assert_eq!(task_count_after, 0);
        assert_eq!(log_count_after, 0);
        Ok(())
    }
}
