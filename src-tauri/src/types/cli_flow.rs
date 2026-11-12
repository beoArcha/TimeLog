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

/// Payload of the `oxy.status` envelope, also returned by `start` without a target while a timer runs.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct StatusPayload {
    pub active_task_ids: Vec<String>,
    pub count: u32,
    pub running: bool,
}
