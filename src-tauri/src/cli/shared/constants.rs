pub const DEFAULT_COLOR: &str = "#FFFFFF";
pub const MSG_ID_EMPTY: &str = "ID cannot be empty";
pub const MSG_LIST_NOT_IMPLEMENTED: &str = "List projects not implemented";

pub const DATE_FORMAT_DATE_ONLY: &str = "%Y-%m-%d";

pub const ERR_STORAGE_INIT: &str = "Storage Initialization Error: {}";
pub const ERR_CLI_PREFIX: &str = "Error: {}";

pub const ERR_DURATION_EMPTY: &str = "Duration string cannot be empty";
pub const ERR_DURATION_INVALID_HOURS: &str = "Invalid hours in '{}'";
pub const ERR_DURATION_INVALID_MINUTES: &str = "Invalid minutes in '{}'";
pub const ERR_DURATION_INVALID_SECONDS: &str = "Invalid seconds in '{}'";
pub const ERR_DURATION_UNRECOGNIZED_CHAR: &str = "Unrecognized character '{}' in duration '{}'";
pub const ERR_DURATION_INVALID_SEGMENT: &str = "Invalid duration segment in '{}'";
pub const ERR_DURATION_PARSE_FAILED: &str = "Could not parse duration '{}'";

pub const ERR_INVALID_TIMESTAMP: &str =
    "Invalid timestamp format '{}': expected RFC3339 (e.g. '2026-10-24T10:00:00Z') or 'YYYY-MM-DD'";
pub const ERR_DATE_RANGE_INVALID: &str = "Filter start date cannot be after end date.";
pub const ERR_TASK_NOT_IN_PROJECT: &str = "Task '{}' does not belong to project '{}'";
pub const ERR_MULTIPLE_TIMERS_SPECIFY_ALL: &str =
    "Multiple active timers running ({}). Use 'oxy stop --all' to stop all active timers.";
pub const PERIOD_LABEL_CUSTOM: &str = "Custom Range";

pub const FORMAT_ERROR_BANNER: &str = "Error [{}]: {}";
pub const FORMAT_ERROR_SUGGESTION: &str = "Suggestion: {}";
pub const FORMAT_ERROR_REMEDIATION: &str = "Remediation: {}";

pub const MSG_ERR_REMEDIATION_HELP: &str =
    "Run 'oxy --help' or 'oxy <command> --help' for syntax instructions.";
pub const MSG_ERR_REMEDIATION_ENTITY: &str =
    "Verify the target entity using 'oxy task ls' or 'oxy project ls'.";
pub const MSG_ERR_REMEDIATION_STORAGE: &str =
    "Check file system permissions and disk capacity for the SQLite database.";
pub const MSG_ERR_REMEDIATION_ENGINE: &str =
    "Inspect active timers using 'oxy status' or stop them with 'oxy stop'.";
pub const MSG_ERR_REMEDIATION_SINK: &str =
    "Verify target file path permissions and available storage for output export.";
pub const FORMAT_REMEDIATION_DID_YOU_MEAN: &str = "Run command using candidate ID '{}'";

pub const EXIT_CODE_SUCCESS: u8 = 0;
pub const EXIT_CODE_GENERIC_FAILURE: u8 = 1;
pub const EXIT_CODE_CLI_SYNTAX: u8 = 2;
pub const EXIT_CODE_STORAGE_ERROR: u8 = 3;
pub const EXIT_CODE_ENTITY_ERROR: u8 = 4;
pub const EXIT_CODE_ENGINE_ERROR: u8 = 5;
