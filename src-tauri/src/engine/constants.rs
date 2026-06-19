//! SQL Query Constants and SQLite database configuration definitions.

// Database configuration pragmas
pub const PRAGMA_JOURNAL_MODE_WAL: &str = "WAL";
pub const PRAGMA_FOREIGN_KEYS_ON: &str = "ON";

// Table schema creation queries
pub const CREATE_PROJECTS_TABLE: &str = "
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
";

pub const CREATE_TASKS_TABLE: &str = "
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        parent_task_id TEXT,
        name TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
";

pub const CREATE_TIME_LOGS_TABLE: &str = "
    CREATE TABLE IF NOT EXISTS time_logs (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
";

// DataManager Insert operations
pub const INSERT_PROJECT: &str = "
    INSERT INTO projects (id, name, color, created_at)
    VALUES (?1, ?2, ?3, ?4)
";

pub const INSERT_TASK: &str = "
    INSERT INTO tasks (id, project_id, name, completed, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5)
";

// Counting operations
pub const SELECT_PROJECT_ID_BY_TASK_ID: &str = "
    SELECT project_id FROM tasks WHERE id = ? LIMIT 1
";

pub const CLOSE_ACTIVE_LOGS_BY_PROJECT: &str = "
    UPDATE time_logs 
    SET end_time = ? 
    WHERE end_time IS NULL 
    AND task_id IN (SELECT id FROM tasks WHERE project_id = ?)
";

pub const CLOSE_ALL_ACTIVE_LOGS: &str = "
    UPDATE time_logs 
    SET end_time = ? 
    WHERE end_time IS NULL
";

pub const INSERT_TIME_LOG: &str = "
    INSERT INTO time_logs (id, task_id, start_time, end_time)
    VALUES (?, ?, ?, NULL)
";

pub const SELECT_ACTIVE_TASK_IDS: &str = "
    SELECT task_id FROM time_logs WHERE end_time IS NULL
";
