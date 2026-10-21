use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Default, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct WebhookQueueItem {
    pub id: String,
    pub url: String,
    pub method: String,
    pub headers: Option<String>,
    pub payload: String,
    pub status: String,
    pub retry_count: i64,
    pub next_retry_at: Option<String>,
    pub last_error: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Default, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct WebhookQueueStats {
    pub pending: i64,
    pub failed: i64,
    pub delivered: i64,
}
