use super::{Project, Task, TimeLog};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ProjectListPayload {
    pub items: Vec<Project>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct TaskListPayload {
    pub items: Vec<Task>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct LogListPayload {
    pub items: Vec<TimeLog>,
    #[ts(type = "number")]
    pub total_matched: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct EntityActionPayload {
    pub id: String,
    pub action: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct LogRemovePayload {
    pub id: String,
    pub action: String,
    pub entry: TimeLog,
}
