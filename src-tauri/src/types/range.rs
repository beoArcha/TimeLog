use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub enum RangePreset {
    Today,
    Yesterday,
    Week,
    LastWeek,
    Month,
    LastMonth,
    All,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct RangeRequest {
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preset: Option<RangePreset>,
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub to: Option<String>,
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timezone: Option<String>,
}

/// Half-open `[from, to)` UTC bounds; a missing bound is unbounded on that side and a missing preset marks a custom range.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedRange {
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub to: Option<String>,
    pub timezone: String,
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preset: Option<RangePreset>,
}
