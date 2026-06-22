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

pub const CREATE_CONFIG_TABLE: &str = "
    CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
";

pub const ALTER_PROJECTS_ADD_ARCHIVED: &str =
    "ALTER TABLE projects ADD COLUMN archived INTEGER DEFAULT 0";
pub const ALTER_PROJECTS_ADD_ORIGINAL_NAME: &str =
    "ALTER TABLE projects ADD COLUMN original_name TEXT";
pub const ALTER_PROJECTS_ADD_ORIGINAL_COLOR: &str =
    "ALTER TABLE projects ADD COLUMN original_color TEXT";
pub const ALTER_PROJECTS_ADD_EDIT_HISTORY: &str =
    "ALTER TABLE projects ADD COLUMN edit_history TEXT";

pub const ALTER_TASKS_ADD_ORIGINAL_NAME: &str = "ALTER TABLE tasks ADD COLUMN original_name TEXT";
pub const ALTER_TASKS_ADD_ORIGINAL_COMPLETED: &str =
    "ALTER TABLE tasks ADD COLUMN original_completed INTEGER DEFAULT 0";
pub const ALTER_TASKS_ADD_EDIT_HISTORY: &str = "ALTER TABLE tasks ADD COLUMN edit_history TEXT";
pub const ALTER_TASKS_ADD_ARCHIVED: &str =
    "ALTER TABLE tasks ADD COLUMN archived INTEGER DEFAULT 0";
