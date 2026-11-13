use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub enum FlowAction {
    Started,
    AlreadyRunning,
    Stopped,
    Noop,
    Switched,
}

/// Payload of the `oxy.start` envelope; `time_log_id` is null when no log was opened.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct StartPayload {
    pub action: FlowAction,
    pub task_id: String,
    pub time_log_id: Option<String>,
    pub stopped_task_ids: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct StopPayload {
    pub action: FlowAction,
    pub stopped_count: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct SwitchPayload {
    pub action: FlowAction,
    pub task_id: String,
    pub time_log_id: String,
}

/// A running timer with its task and project resolved, shared by `oxy.status` and `oxy.dashboard`.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ActiveSessionPayload {
    pub task_id: String,
    pub task_name: String,
    pub project_id: String,
    pub project_name: String,
    /// Stored RFC3339 start time of the running log.
    pub start: String,
    #[ts(type = "number")]
    pub elapsed_seconds: u64,
}

/// Payload of the `oxy.status` envelope, also returned by `start` without a target while a timer runs.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct StatusPayload {
    pub active: Vec<ActiveSessionPayload>,
    pub count: u32,
    pub running: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct RecentTaskPayload {
    pub task_id: String,
    pub task_name: String,
    pub project_name: String,
    /// Seconds inside today, so a session that started yesterday only counts its part of today.
    #[ts(type = "number")]
    pub duration_seconds: u64,
}

/// Payload of the `oxy.dashboard` envelope. Durations are raw seconds; formatting is a human-output concern.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct DashboardPayload {
    pub running: bool,
    pub active_session: Option<ActiveSessionPayload>,
    pub today_date: String,
    #[ts(type = "number")]
    pub today_total_seconds: u64,
    #[ts(type = "number")]
    pub session_count: u64,
    pub recent_tasks: Vec<RecentTaskPayload>,
}
