pub const HEADER_REPORT_TREE: &str =
    "📊 Time Tracking Hierarchy Report ({})\n──────────────────────────────────────────────────\n";
pub const FORMAT_REPORT_TOTAL: &str = "Total Time: {} ({} active tasks)\n";

pub const FORMAT_TREE_PROJECT: &str = "📦 \"{}\" [{}] ({}%) [{}]\n";
pub const FORMAT_TREE_TASK: &str = "📋 \"{}\" [{}] ({}%) [{}]\n";
pub const FORMAT_TREE_SUBTASK: &str = "↳ \"{}\" [{}] ({}%) [{}]\n";

pub const TREE_BRANCH_MID: &str = "├── ";
pub const TREE_BRANCH_LAST: &str = "└── ";
pub const TREE_INDENT_PIPE: &str = "│   ";
pub const TREE_INDENT_SPACE: &str = "    ";

pub const PROGRESS_BAR_FILLED: &str = "█";
pub const PROGRESS_BAR_EMPTY: &str = "░";

pub const DIVIDER_LINE: &str = "──────────────────────────────────────────────────\n";
pub const MSG_NO_REPORT_DATA: &str = "No time logs recorded for the selected period.";

pub const TABLE_SEPARATOR_RICH: &str = "─";
pub const TABLE_SEPARATOR_PLAIN: &str = "-";
pub const TABLE_ELLIPSIS: &str = "…";
pub const TABLE_COLUMN_SEPARATOR: &str = "  ";

pub const DURATION_SUFFIX_HOUR: &str = "h";
pub const DURATION_SUFFIX_MINUTE: &str = "m";
pub const DURATION_SUFFIX_SECOND: &str = "s";

pub const PERIOD_LABEL_TODAY: &str = "Today";
pub const PERIOD_LABEL_YESTERDAY: &str = "Yesterday";
pub const PERIOD_LABEL_WEEK: &str = "This Week";
pub const PERIOD_LABEL_LAST_WEEK: &str = "Last Week";
pub const PERIOD_LABEL_MONTH: &str = "This Month";
pub const PERIOD_LABEL_LAST_MONTH: &str = "Last Month";
pub const PERIOD_LABEL_ALL: &str = "All Time";
pub const PERIOD_LABEL_CUSTOM: &str = "Custom Range";
pub const PERIOD_LABEL_TEMPLATE: &str = "{}, {}";
