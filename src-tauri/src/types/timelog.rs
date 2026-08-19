use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct TaskEditHistory {
    pub edited_at: String,
    #[ts(optional)]
    pub prev_name: Option<String>,
    #[ts(optional)]
    pub prev_completed: Option<bool>,
    #[ts(optional)]
    pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS, PartialEq, Default)]
#[ts(export)]
pub enum TaskStatus {
    #[default]
    Todo,
    InProgress,
    Done,
    Blocked,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub project_id: String,
    #[ts(optional)]
    pub parent_task_id: Option<String>,
    pub name: String,
    pub created_at: String,
    pub completed: bool,
    #[ts(optional)]
    pub status: Option<TaskStatus>,
    #[ts(optional)]
    pub original_name: Option<String>,
    #[ts(optional)]
    pub original_completed: Option<bool>,
    #[ts(optional)]
    pub edit_history: Option<Vec<TaskEditHistory>>,
    #[ts(optional)]
    pub archived: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct TimeLogEditHistory {
    pub edited_at: String,
    #[ts(optional)]
    pub prev_start_time: Option<String>,
    #[ts(optional)]
    pub prev_end_time: Option<String>,
    #[ts(optional)]
    pub prev_note: Option<String>,
    #[ts(optional)]
    pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct TimeLog {
    pub id: String,
    pub task_id: String,
    pub project_id: String,
    pub start_time: String,
    #[ts(optional)]
    pub end_time: Option<String>,
    #[ts(optional)]
    pub note: Option<String>,
    #[ts(optional)]
    pub edit_history: Option<Vec<TimeLogEditHistory>>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct TimerRepositoryState {
    pub projects: Vec<super::Project>,
    pub tasks: Vec<Task>,
    pub logs: Vec<TimeLog>,
    pub active_log: Option<TimeLog>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct PatchLog {
    pub id: String,
    pub project_id: String,
    #[ts(optional)]
    pub task_id: Option<String>,
    pub start_time: String,
    pub end_time: String,
    pub patch_note: String,
    #[ts(optional)]
    pub is_system_event: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS, Default)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ElapsedRangeFilter {
    #[ts(optional)]
    pub task_id: Option<String>,
    #[ts(optional)]
    pub project_id: Option<String>,
    #[ts(optional)]
    pub from: Option<String>,
    #[ts(optional)]
    pub to: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS, PartialEq, Eq)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct TaskComputedMetrics {
    pub task_id: String,
    pub elapsed_seconds: u64,
    pub self_elapsed_seconds: u64,
    pub is_running: bool,
    pub has_running_child: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS, PartialEq, Eq)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ProjectComputedMetrics {
    pub project_id: String,
    pub total_elapsed_seconds: u64,
    pub today_elapsed_seconds: u64,
    pub this_week_elapsed_seconds: u64,
    pub active_task_count: usize,
    pub completed_task_count: usize,
    pub is_running: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS, PartialEq, Eq)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct EngineComputedMetrics {
    pub snapshot_now_iso: String,
    pub tasks: std::collections::HashMap<String, TaskComputedMetrics>,
    pub projects: std::collections::HashMap<String, ProjectComputedMetrics>,
}
