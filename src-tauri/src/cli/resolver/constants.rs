pub const LABEL_ENTITY_PROJECT: &str = "Project";
pub const LABEL_ENTITY_TASK: &str = "Task";

pub const ERR_RESOLVE_NOT_FOUND: &str = "{} '{}' not found.";
pub const ERR_RESOLVE_AMBIGUOUS: &str =
    "Ambiguous {} target '{}'. Matched: {}. Please specify a unique ID or title.";
pub const ERR_RESOLVE_DID_YOU_MEAN: &str = "{} '{}' not found. Did you mean '{}'?";
pub const ERR_RESOLVE_STORAGE: &str = "Storage error: {}";

pub const FORMAT_CANDIDATE_MATCH: &str = "\"{}\" ({})";

pub const PROMPT_AMBIGUOUS_MATCHES: &str = "Multiple {} matches found for '{}':\n";
pub const PROMPT_OPTION_ROW: &str = "  [{}] \"{}\" [ID: {}]\n";
pub const PROMPT_CHOOSE_INPUT: &str = "Choose {} [1-{}] (or 'q' to cancel): ";
pub const PROMPT_ENTER_TASK_TARGET: &str =
    "Enter task name or ID to start tracking (or 'q' to cancel): ";
pub const PROMPT_CANCELLED: &str = "Operation cancelled.";
pub const PROMPT_INVALID_SELECTION: &str = "Invalid selection: '{}'";
