pub const CREATE_SCHEMA_MIGRATIONS_TABLE: &str = "
    CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
    )
";

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
        note TEXT,
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

pub const ALTER_TIME_LOGS_ADD_NOTE: &str = "ALTER TABLE time_logs ADD COLUMN note TEXT";

pub const CREATE_TIME_LOGS_HISTORY_TABLE: &str = "
    CREATE TABLE IF NOT EXISTS time_logs_history (
        id TEXT PRIMARY KEY,
        time_log_id TEXT NOT NULL,
        edited_at TEXT NOT NULL,
        prev_start_time TEXT NOT NULL,
        prev_end_time TEXT,
        prev_note TEXT,
        reason TEXT NOT NULL,
        FOREIGN KEY(time_log_id) REFERENCES time_logs(id) ON DELETE CASCADE
    )
";

pub const ALTER_PROJECTS_ADD_DESCRIPTION: &str = "ALTER TABLE projects ADD COLUMN description TEXT";
pub const ALTER_PROJECTS_ADD_ICON: &str = "ALTER TABLE projects ADD COLUMN icon TEXT";
pub const ALTER_PROJECTS_ADD_TAGS: &str = "ALTER TABLE projects ADD COLUMN tags TEXT";
pub const ALTER_PROJECTS_ADD_ALLOW_CONCURRENCY: &str =
    "ALTER TABLE projects ADD COLUMN allow_concurrency INTEGER DEFAULT 0";

pub const ALTER_TASKS_ADD_STATUS: &str = "ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'Todo'";

pub const CREATE_RUNTIME_CONFIGS_TABLE: &str = "
    CREATE TABLE IF NOT EXISTS runtime_configs (
        id TEXT PRIMARY KEY,
        runtime TEXT NOT NULL,
        config TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
";

pub const CREATE_HOLIDAYS_TABLE: &str = "
    CREATE TABLE IF NOT EXISTS holidays (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        note TEXT,
        original_name TEXT,
        original_date TEXT,
        original_type TEXT,
        edit_history TEXT
    )
";

pub const CREATE_PATCHES_TABLE: &str = "
    CREATE TABLE IF NOT EXISTS patches (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        task_id TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        patch_note TEXT NOT NULL,
        is_system_event INTEGER DEFAULT 0,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
";

pub const CREATE_WEBHOOK_QUEUE_TABLE: &str = "
    CREATE TABLE IF NOT EXISTS webhook_queue (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        method TEXT NOT NULL,
        headers TEXT,
        payload TEXT NOT NULL,
        status TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        next_retry_at TEXT,
        last_error TEXT,
        created_at TEXT NOT NULL
    )
";

pub const CREATE_CLI_ALIASES_TABLE: &str = "
    CREATE TABLE IF NOT EXISTS cli_aliases (
        name TEXT PRIMARY KEY,
        template TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
";

pub const CREATE_CLI_SINKS_TABLE: &str = "
    CREATE TABLE IF NOT EXISTS cli_sinks (
        name TEXT PRIMARY KEY,
        sink_type TEXT NOT NULL,
        target TEXT NOT NULL,
        config TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
    )
";
