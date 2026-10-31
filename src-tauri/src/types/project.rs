use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
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
#[ts(export)]
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
    #[ts(optional)]
    pub description: Option<String>,
    #[ts(optional)]
    pub icon: Option<String>,
    #[ts(optional)]
    pub tags: Option<Vec<String>>,
    #[ts(optional)]
    pub allow_concurrency: Option<bool>,
    #[ts(optional)]
    pub hourly_rate: Option<String>,
    #[ts(optional)]
    pub currency: Option<String>,
    #[ts(optional)]
    pub billing_rate_cents: Option<i64>,
    #[ts(optional)]
    pub billing_currency: Option<String>,
}

impl Project {
    pub fn new(
        id: String,
        name: String,
        color: String,
        description: Option<String>,
        icon: Option<String>,
        tags: Option<Vec<String>>,
        allow_concurrency: Option<bool>,
    ) -> Self {
        Self {
            id,
            name,
            color,
            created_at: chrono::Utc::now().to_rfc3339(),
            archived: Some(false),
            original_name: None,
            original_color: None,
            edit_history: None,
            description,
            icon,
            tags,
            allow_concurrency,
            hourly_rate: None,
            currency: None,
            billing_rate_cents: None,
            billing_currency: None,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ProjectStatistics {
    #[ts(type = "number")]
    pub total_duration_sec: u64,
    pub total_tasks: u32,
    pub completed_tasks: u32,
}
