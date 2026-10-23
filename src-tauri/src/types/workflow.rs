use serde::{Deserialize, Serialize};
use ts_rs::TS;

pub const DEFAULT_AUTO_STOP_HOURS_LIMIT_ENABLED: bool = false;
pub const DEFAULT_AUTO_STOP_HOURS_LIMIT: f64 = 8.0;
pub const DEFAULT_AUTO_STOP_DAILY_BOUNDARY_ENABLED: bool = false;
pub const DEFAULT_AUTO_STOP_DAILY_BOUNDARY_TIME: &str = "19:00";
pub const DEFAULT_AUTO_STOP_ON_TASK_COMPLETE: bool = false;
pub const DEFAULT_WARNING_NOTIFICATION_ENABLED: bool = true;

pub const REASON_HOURS_LIMIT: &str = "hours_limit";
pub const REASON_DAILY_BOUNDARY: &str = "daily_boundary";
pub const REASON_TASK_COMPLETED: &str = "task_completed";
pub const REASON_TASK_COMPLETE: &str = REASON_TASK_COMPLETED;

pub const WARNING_LEAD_SECONDS: i64 = 900;
pub const WARNING_LEAD_SECONDS_U32: u32 = 900;
pub const TIME_FORMAT_HM: &str = "%H:%M";

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowConfig {
    pub auto_stop_hours_limit_enabled: bool,
    pub auto_stop_hours_limit: f64,
    pub auto_stop_daily_boundary_enabled: bool,
    pub auto_stop_daily_boundary_time: String,
    pub auto_stop_on_task_complete: bool,
    pub warning_notification_enabled: bool,
}

impl Default for WorkflowConfig {
    fn default() -> Self {
        Self {
            auto_stop_hours_limit_enabled: DEFAULT_AUTO_STOP_HOURS_LIMIT_ENABLED,
            auto_stop_hours_limit: DEFAULT_AUTO_STOP_HOURS_LIMIT,
            auto_stop_daily_boundary_enabled: DEFAULT_AUTO_STOP_DAILY_BOUNDARY_ENABLED,
            auto_stop_daily_boundary_time: DEFAULT_AUTO_STOP_DAILY_BOUNDARY_TIME.to_string(),
            auto_stop_on_task_complete: DEFAULT_AUTO_STOP_ON_TASK_COMPLETE,
            warning_notification_enabled: DEFAULT_WARNING_NOTIFICATION_ENABLED,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Default, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowStatus {
    pub is_daemon_running: bool,
    #[ts(optional)]
    pub last_check_iso: Option<String>,
    #[ts(optional)]
    pub last_auto_stop_reason: Option<String>,
    #[ts(optional)]
    pub last_auto_stop_time_iso: Option<String>,
    #[ts(optional)]
    pub last_error: Option<String>,
    #[ts(optional)]
    pub last_error_time_iso: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowCheckResult {
    pub stopped: bool,
    #[ts(optional)]
    pub reason: Option<String>,
    pub warning: bool,
}
