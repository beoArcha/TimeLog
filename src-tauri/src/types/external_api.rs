use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Default, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ExternalApiSettings {
    pub log_to_api: bool,
    pub api_token: String,
    pub api_url: String,
    pub api_method: String,
    pub api_headers: String,
}
