pub const MSG_PROJECT_CREATED: &str = "Created project with ID: {}";
pub const MSG_PROJECT_ARCHIVED: &str = "Archived project: {}";
pub const MSG_PROJECT_RENAMED: &str = "Renamed project: {}";
pub const MSG_PROJECT_UPDATED: &str = "Updated project: {}";
pub const MSG_PROJECT_NOT_FOUND: &str = "Project not found: {}";
pub const MSG_NO_PROJECTS_FOUND: &str = "No projects found.";
pub const MSG_NO_PROJECTS_EXIST: &str =
    "No projects exist. Create a project first with 'oxy project add <name>'";
pub const ERR_PROJECT_RENAME_EMPTY: &str = "At least one of new name or --color must be provided.";

pub const MSG_TASK_CREATED: &str = "Created task with ID: {}";
pub const MSG_TASK_ARCHIVED: &str = "Archived task: {}";
pub const MSG_TASK_RENAMED: &str = "Renamed task: {}";
pub const MSG_TASK_REPARENTED: &str = "Reparented task '{}' under '{}'";
pub const MSG_TASK_DETACHED: &str = "Detached task '{}' as a root task";
pub const MSG_TASK_MOVED: &str = "Moved task '{}' to project '{}'";
pub const ERR_REPARENT_SELF: &str = "Cannot reparent task to itself.";
pub const ERR_REPARENT_DIFFERENT_PROJECT: &str = "Parent task belongs to a different project.";
pub const MSG_TASK_NOT_FOUND: &str = "Task not found: {}";
pub const MSG_TASK_COMPLETED: &str = "Marked task '{}' [{}] as completed.";
pub const MSG_NO_TASKS_FOUND: &str = "No tasks found matching criteria.";

pub const MSG_SUBTASK_CREATED: &str = "Created subtask with ID: {}";
pub const MSG_SUBTASK_ARCHIVED: &str = "Archived subtask: {}";
pub const MSG_NO_SUBTASKS_FOUND: &str = "No subtasks found for task {}";
pub const MSG_SUBTASKS_HEADER: &str = "Subtasks for task {}:";

pub const MSG_LOG_RECORDED: &str = "Logged {} to '{}' [ID: {}]";
pub const MSG_LOG_UPDATED: &str = "Updated time log: {}";
pub const MSG_LOG_DELETED: &str = "Deleted time log: {}";
pub const MSG_NO_LOGS_FOUND: &str = "No time logs found matching criteria.";
pub const ERR_INVALID_TIMESTAMP: &str =
    "Invalid timestamp format '{}': expected RFC3339 (e.g. '2026-10-24T10:00:00Z') or 'YYYY-MM-DD'";
pub const ERR_LOG_ADD_NO_DURATION_OR_FROM: &str =
    "Either duration or --from timestamp must be provided.";
pub const ERR_LOG_EDIT_EMPTY: &str =
    "At least one field to edit must be provided (--duration, --note, --start, --end, --task).";

pub const MSG_NO_TARGET_SPECIFIED: &str = "No target task specified. Usage: oxy start <target>";
pub const MSG_NO_TODAY_LOGS: &str =
    "No time recorded today yet. Use 'oxy start <task>' to begin.\n";

pub const MSG_NO_SINKS_CONFIGURED: &str =
    "No external sinks configured. Use 'oxy sink set-csv' or 'oxy sink set-webhook'.";
pub const HEADER_SINKS: &str =
    "📡 Configured Sinks:\n──────────────────────────────────────────────────\n";
pub const FORMAT_SINK_LIST_ITEM: &str = " • [{}] {} ➔ {} ({})\n";
pub const MSG_SINK_CSV_CONFIGURED: &str = "Configured CSV audit sink directory: {}";
pub const MSG_SINK_WEBHOOK_CONFIGURED: &str = "Configured webhook sink URL: {}";
pub const MSG_SINK_TEST_HEADER: &str =
    "🧪 Testing Configured Sinks:\n──────────────────────────────────────────────────\n";
pub const FORMAT_SINK_TEST_RESULT: &str = " {} [{}] {}: {}\n";
pub const ERR_SINK_INVALID_URL: &str = "Invalid webhook URL: must start with http:// or https://";
pub const ERR_SINK_INVALID_DIR: &str = "Invalid CSV directory: path is empty";

pub const MSG_NO_MASKS_CONFIGURED: &str =
    "No action masks configured. Use 'oxy mask set <name> <template>'.";
pub const HEADER_MASKS: &str =
    "🎭 Registered Action Masks:\n──────────────────────────────────────────────────\n";
pub const FORMAT_MASK_LIST_ITEM: &str = " • {} ➔ \"{}\"\n";
pub const MSG_MASK_CONFIGURED: &str = "Registered action mask '{}' ➔ \"{}\"";
pub const MSG_MASK_REMOVED: &str = "Removed action mask: {}";
pub const ERR_MASK_NOT_FOUND: &str = "Action mask '{}' not found.";
pub const ERR_MASK_EMPTY_NAME: &str = "Action mask name cannot be empty.";
pub const ERR_MASK_EMPTY_TEMPLATE: &str = "Action mask template cannot be empty.";
pub const ERR_MASK_SELF_REFERENCE: &str =
    "Action mask template cannot reference itself recursively.";

pub const MSG_NO_CONFIG_ENTRIES: &str = "No configuration entries found.";
pub const HEADER_CONFIG: &str =
    "⚙️  Configuration Settings:\n──────────────────────────────────────────────────\n";
pub const FORMAT_CONFIG_LIST_ITEM: &str = " • {} = \"{}\"\n";
pub const MSG_CONFIG_SET: &str = "Set configuration '{}' = \"{}\"";
pub const ERR_CONFIG_KEY_NOT_FOUND: &str = "Configuration key '{}' not found.";
pub const ERR_CONFIG_EMPTY_KEY: &str = "Configuration key cannot be empty.";

pub const HEADER_PROJECTS: &str =
    "📂 Projects:\n──────────────────────────────────────────────────\n";
pub const HEADER_TASKS: &str = "📋 Tasks:\n──────────────────────────────────────────────────\n";
pub const HEADER_TIME_LOGS: &str = "⏱️  Time Logs:\n────────────────────────────────────────────────────────────────────────────\n";
pub const HEADER_QUICK_STATUS: &str =
    "⚡ oXyFlow Quick Status\n──────────────────────────────────────────────────\n";
pub const HEADER_TODAY_PREFIX: &str =
    "📅 Work Summary for Today ({})\n──────────────────────────────────────────────────\n";
pub const DIVIDER_LINE: &str = "──────────────────────────────────────────────────\n";

pub const HEADER_DASHBOARD: &str =
    "⚡ oXyFlow Quick Status Dashboard\n──────────────────────────────────────────────────\n";
pub const SECTION_ACTIVE_SESSION: &str = "⏱️  Active Tracking Session\n";
pub const SECTION_TODAY_PROGRESS: &str = "📈 Today's Progress\n";
pub const SECTION_RECENT_ACTIVITY: &str = "🕒 Recent Activity\n";
pub const FORMAT_DASHBOARD_ACTIVE: &str =
    " • Task: \"{}\" [{}]\n • Project: \"{}\"\n • Elapsed: {}\n";
pub const FORMAT_DASHBOARD_PROGRESS: &str = " • Total Logged: {} across {} sessions\n";
pub const FORMAT_DASHBOARD_RECENT_ITEM: &str = " • \"{}\" ({}) ➔ {}\n";
pub const DASHBOARD_TIP_FOOTER: &str =
    "──────────────────────────────────────────────────\n💡 Tip: Use 'oxy sw <task>' to switch tasks | 'oxy report' for full breakdown\n";

pub const STATUS_IDLE_NOTICE: &str = "Status: ⏸️  IDLE (No active timers)\n";
pub const STATUS_IDLE_TIP: &str = "Tip: Use 'oxy start <task>' or 'oxy t ls' to view tasks.\n";
pub const STATUS_ACTIVE_NOTICE: &str = "Status: ▶️  ACTIVE TIMER RUNNING\n";

pub const SYMBOL_TASK_DONE: &str = "[X]";
pub const SYMBOL_TASK_TODO: &str = "[ ]";

pub const FORMAT_PROJECT_ROW: &str = " • \"{}\" [ID: {}] ({}) — {} tasks{}\n";
pub const FORMAT_TASK_ROOT_ROW: &str = "{} \"{}\" [ID: {}] ({})\n";
pub const FORMAT_TASK_SUBTASK_ROW: &str = "   ↳ {} \"{}\" [ID: {}]\n";
pub const FORMAT_TASK_ORPHAN_ROW: &str = " • {} \"{}\" [ID: {}]{}\n";
pub const FORMAT_TODAY_ITEM: &str = " • [{}] {} ➔ {}m {}s\n";
pub const FORMAT_TODAY_TOTAL: &str = "Total Time Today: {}h {}m ({} entries)\n";
pub const FORMAT_LOG_ROW: &str = " • [{}] \"{}\" ({}) ➔ [ID: {}]{}\n";
pub const FORMAT_LOG_NOTE: &str = " — \"{}\"";
pub const FORMAT_DURATION_MINS_SECS: &str = "{}m {}s";

pub const LABEL_ARCHIVED_BADGE: &str = " [ARCHIVED]";
pub const LABEL_ACTIVE_TIMER: &str = "ACTIVE ⏳";
pub const LABEL_UNKNOWN_TASK: &str = "Unknown Task";
pub const LABEL_UNKNOWN_PROJECT: &str = "Unknown";
pub const LABEL_GENERAL_PROJECT: &str = "General";
pub const LABEL_SUBTASK_BADGE: &str = " (Subtask)";
pub const LABEL_INVALID_DURATION: &str = "invalid";

pub const OUT_STARTED: &str = "▶️ Started tracking task: {}";
pub const OUT_STOPPED: &str = "⏹️ Stopped all active projects timer tracking threads.";
pub const OUT_STATUS_COUNT: &str = "⚡ Count of Concurrent Tracking Threads: {}";
pub const OUT_STATUS_ACTIVE: &str = "• Task active in SQLite: {}";
pub const OUT_SUCCESS: &str = "✅ {}";

pub const PERIOD_LABEL_TODAY: &str = "Today";
pub const PERIOD_LABEL_WEEK: &str = "This Week";
pub const PERIOD_LABEL_MONTH: &str = "This Month";
pub const PERIOD_LABEL_ALL: &str = "All Time";
pub const PERIOD_LABEL_CUSTOM: &str = "Custom Range";

pub const ERR_DATE_RANGE_INVALID: &str = "Filter start date cannot be after end date.";
pub const ERR_TASK_NOT_IN_PROJECT: &str = "Task '{}' does not belong to project '{}'";
pub const ERR_MULTIPLE_TIMERS_SPECIFY_ALL: &str =
    "Multiple active timers running ({}). Use 'oxy stop --all' to stop all active timers.";

pub const HEADER_DOCTOR: &str =
    "🩺 oXyFlow System & Database Diagnostics\n──────────────────────────────────────────────────\n";
pub const FORMAT_DOCTOR_ITEM: &str = " • [{}] {}: {}\n";
pub const FORMAT_DOCTOR_DB_INFO: &str = " • Database: {} ({} bytes)\n";
pub const MSG_DOCTOR_SUCCESS: &str = "All diagnostic checks passed successfully.";
pub const ERR_DOCTOR_FAILED: &str = "One or more diagnostic checks failed.";

pub const MSG_DB_BACKUP_SUCCESS: &str = "Database successfully backed up to '{}'";
pub const MSG_DB_RESTORE_SUCCESS: &str = "Database successfully restored from '{}'";
pub const ERR_DB_BACKUP_PATH_EMPTY: &str = "Backup destination path cannot be empty";
pub const ERR_DB_RESTORE_PATH_EMPTY: &str = "Restore source path cannot be empty";
pub const ERR_DB_RESTORE_NOT_FOUND: &str = "Backup source file '{}' does not exist";
