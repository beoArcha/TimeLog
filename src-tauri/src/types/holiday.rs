use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
#[serde(rename_all = "lowercase")]
#[ts(export_to = "../../src/bindings/HolidayType.ts")]
pub enum HolidayType {
    Holiday,
    Leave,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/HolidayLeaveEditHistory.ts")]
#[serde(rename_all = "camelCase")]
pub struct HolidayLeaveEditHistory {
    pub edited_at: String,
    #[ts(optional)]
    pub prev_name: Option<String>,
    #[ts(optional)]
    pub prev_date: Option<String>,
    #[ts(optional)]
    pub prev_type: Option<HolidayType>,
    #[ts(optional)]
    pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/HolidayLeave.ts")]
#[serde(rename_all = "camelCase")]
pub struct HolidayLeave {
    pub id: String,
    pub date: String,
    pub r#type: HolidayType,
    pub name: String,
    #[ts(optional)]
    pub note: Option<String>,
    #[ts(optional)]
    pub original_name: Option<String>,
    #[ts(optional)]
    pub original_date: Option<String>,
    #[ts(optional)]
    pub original_type: Option<HolidayType>,
    #[ts(optional)]
    pub edit_history: Option<Vec<HolidayLeaveEditHistory>>,
}
