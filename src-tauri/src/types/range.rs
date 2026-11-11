use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
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
    pub preset: Option<RangePreset>,
    #[ts(optional)]
    pub from: Option<String>,
    #[ts(optional)]
    pub to: Option<String>,
    #[ts(optional)]
    pub timezone: Option<String>,
}

/// Half-open `[from, to)` UTC bounds; a missing bound is unbounded on that side and a missing preset marks a custom range.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedRange {
    #[ts(optional)]
    pub from: Option<String>,
    #[ts(optional)]
    pub to: Option<String>,
    pub timezone: String,
    #[ts(optional)]
    pub preset: Option<RangePreset>,
}
