use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/ProjectEditHistory.ts")]
#[serde(rename_all = "camelCase")]
pub struct ProjectEditHistory {
    pub edited_at: String,
    #[ts(optional)]
    pub prev_name: Option<String>,
    #[ts(optional)]
    pub prev_color: Option<String>,
    #[ts(optional)]
    pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/Project.ts")]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub color: String,
    pub created_at: String,
    #[ts(optional)]
    pub archived: Option<bool>,
    #[ts(optional)]
    pub original_name: Option<String>,
    #[ts(optional)]
    pub original_color: Option<String>,
    #[ts(optional)]
    pub edit_history: Option<Vec<ProjectEditHistory>>,
}
