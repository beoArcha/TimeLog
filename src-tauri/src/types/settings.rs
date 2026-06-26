use super::SinkType;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/Settings.ts")]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub auto_start: bool,
    pub auto_pause_on_sleep: bool,
    pub include_patches_in_reports: bool,
    pub active_sinks: Vec<SinkType>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            auto_start: false,
            auto_pause_on_sleep: true,
            include_patches_in_reports: false,
            active_sinks: vec![SinkType::Csv],
        }
    }
}
