pub const DEFAULT_COLOR: &str = "#FFFFFF";

pub const MSG_PROJECT_CREATED: &str = "Created project with ID: {}";
pub const MSG_PROJECT_ARCHIVED: &str = "Archived project: {}";
pub const MSG_PROJECT_RENAMED: &str = "Renamed project: {}";
pub const MSG_PROJECT_NOT_FOUND: &str = "Project not found: {}";
pub const MSG_NO_PROJECTS_FOUND: &str = "No projects found.";
pub const MSG_NO_PROJECTS_EXIST: &str =
    "No projects exist. Create a project first with 'oxy project add <name>'";

pub const MSG_TASK_CREATED: &str = "Created task with ID: {}";
pub const MSG_TASK_ARCHIVED: &str = "Archived task: {}";
pub const MSG_TASK_RENAMED: &str = "Renamed task: {}";
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

pub const MSG_NO_TARGET_SPECIFIED: &str = "No target task specified. Usage: oxy start <target>";
pub const MSG_NO_TODAY_LOGS: &str =
    "No time recorded today yet. Use 'oxy start <task>' to begin.\n";

pub const MSG_LIST_NOT_IMPLEMENTED: &str = "List projects not implemented";
pub const MSG_ID_EMPTY: &str = "ID cannot be empty";

pub const MSG_STUB_REPORT: &str =
    "Not implemented yet: Reporting and export engine will be implemented in Phase 10.4.";
pub const MSG_STUB_SINK: &str =
    "Not implemented yet: External CSV and webhook sinks will be implemented in Phase 10.6.";
pub const MSG_STUB_MASK: &str =
    "Not implemented yet: Action masks and command aliases will be implemented in Phase 10.6.";
pub const MSG_STUB_CONFIG: &str =
    "Not implemented yet: Configuration management will be implemented in Phase 10.6.";

pub const OUT_STARTED: &str = "▶️ Started tracking task: {}";
pub const OUT_STOPPED: &str = "⏹️ Stopped all active projects timer tracking threads.";
pub const OUT_STATUS_COUNT: &str = "⚡ Count of Concurrent Tracking Threads: {}";
pub const OUT_STATUS_ACTIVE: &str = "• Task active in SQLite: {}";
pub const OUT_SUCCESS: &str = "✅ {}";

pub const HEADER_PROJECTS: &str =
    "📂 Projects:\n──────────────────────────────────────────────────\n";
pub const HEADER_TASKS: &str = "📋 Tasks:\n──────────────────────────────────────────────────\n";
pub const HEADER_TIME_LOGS: &str = "⏱️  Time Logs:\n────────────────────────────────────────────────────────────────────────────\n";
pub const HEADER_QUICK_STATUS: &str =
    "⚡ oXyFlow Quick Status\n──────────────────────────────────────────────────\n";
pub const HEADER_TODAY_PREFIX: &str =
    "📅 Work Summary for Today ({})\n──────────────────────────────────────────────────\n";
pub const DIVIDER_LINE: &str = "──────────────────────────────────────────────────\n";

pub const LABEL_ARCHIVED_BADGE: &str = " [ARCHIVED]";
pub const LABEL_ACTIVE_TIMER: &str = "ACTIVE ⏳";
pub const LABEL_UNKNOWN_TASK: &str = "Unknown Task";
pub const LABEL_UNKNOWN_PROJECT: &str = "Unknown";
pub const LABEL_GENERAL_PROJECT: &str = "General";
pub const LABEL_SUBTASK_BADGE: &str = " (Subtask)";
pub const LABEL_INVALID_DURATION: &str = "invalid";
pub const LABEL_ENTITY_PROJECT: &str = "Project";
pub const LABEL_ENTITY_TASK: &str = "Task";

pub const STATUS_IDLE_NOTICE: &str = "Status: ⏸️  IDLE (No active timers)\n";
pub const STATUS_IDLE_TIP: &str = "Tip: Use 'oxy start <task>' or 'oxy t ls' to view tasks.\n";
pub const STATUS_ACTIVE_NOTICE: &str = "Status: ▶️  ACTIVE TIMER RUNNING\n";

pub const SYMBOL_TASK_DONE: &str = "[X]";
pub const SYMBOL_TASK_TODO: &str = "[ ]";
pub const SYMBOL_SUBTASK_CHECKED: &str = "x";
pub const SYMBOL_SUBTASK_UNCHECKED: &str = " ";

pub const DATE_FORMAT_DATE_ONLY: &str = "%Y-%m-%d";

pub const FORMAT_PROJECT_ROW: &str = " • \"{}\" [ID: {}] ({}) — {} tasks{}\n";
pub const FORMAT_TASK_ROOT_ROW: &str = "{} \"{}\" [ID: {}] ({})\n";
pub const FORMAT_TASK_SUBTASK_ROW: &str = "   ↳ {} \"{}\" [ID: {}]\n";
pub const FORMAT_TASK_ORPHAN_ROW: &str = " • {} \"{}\" [ID: {}]{}\n";
pub const FORMAT_TODAY_ITEM: &str = " • [{}] {} ➔ {}m {}s\n";
pub const FORMAT_TODAY_TOTAL: &str = "Total Time Today: {}h {}m ({} entries)\n";
pub const FORMAT_GLANCE_TRACKING: &str = " • Tracking: \"{}\" [{}]\n";
pub const FORMAT_LOG_ROW: &str = " • [{}] \"{}\" ({}) ➔ [ID: {}]{}\n";
pub const FORMAT_LOG_NOTE: &str = " — \"{}\"";
pub const FORMAT_DURATION_MINS_SECS: &str = "{}m {}s";
pub const FORMAT_SUBTASK_ITEM: &str = "• [{}] {} ({})";
pub const FORMAT_SETTINGS_VIEW: &str = "Settings: {}";
pub const FORMAT_CANDIDATE_MATCH: &str = "\"{}\" ({})";

pub const ERR_STORAGE_INIT: &str = "Storage Initialization Error: {}";
pub const ERR_CLI_PREFIX: &str = "Error: {}";

pub const ERR_RESOLVE_NOT_FOUND: &str = "{} '{}' not found.";
pub const ERR_RESOLVE_AMBIGUOUS: &str =
    "Ambiguous {} target '{}'. Matched: {}. Please specify a unique ID or title.";
pub const ERR_RESOLVE_DID_YOU_MEAN: &str = "{} '{}' not found. Did you mean '{}'?";
pub const ERR_RESOLVE_STORAGE: &str = "Storage error: {}";

pub const ERR_DURATION_EMPTY: &str = "Duration string cannot be empty";
pub const ERR_DURATION_INVALID_HOURS: &str = "Invalid hours in '{}'";
pub const ERR_DURATION_INVALID_MINUTES: &str = "Invalid minutes in '{}'";
pub const ERR_DURATION_INVALID_SECONDS: &str = "Invalid seconds in '{}'";
pub const ERR_DURATION_UNRECOGNIZED_CHAR: &str = "Unrecognized character '{}' in duration '{}'";
pub const ERR_DURATION_INVALID_SEGMENT: &str = "Invalid duration segment in '{}'";
pub const ERR_DURATION_PARSE_FAILED: &str = "Could not parse duration '{}'";

pub const EXIT_CODE_SUCCESS: u8 = 0;
pub const EXIT_CODE_GENERIC_FAILURE: u8 = 1;
pub const EXIT_CODE_CLI_SYNTAX: u8 = 2;
pub const EXIT_CODE_STORAGE_ERROR: u8 = 3;
pub const EXIT_CODE_ENTITY_ERROR: u8 = 4;
pub const EXIT_CODE_ENGINE_ERROR: u8 = 5;
