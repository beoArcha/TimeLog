use super::SinkType;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub auto_start: bool,
    pub auto_pause_on_sleep: bool,
    pub include_patches_in_reports: bool,
    pub active_sinks: Vec<SinkType>,
    #[ts(optional)]
    pub theme: Option<String>,
    #[ts(optional)]
    pub text_and_icon_size: Option<String>,
    #[ts(optional)]
    pub gui_variant: Option<String>,
    #[ts(optional)]
    pub always_on_top_small: Option<bool>,
    #[ts(optional)]
    pub always_on_top_main: Option<bool>,
    #[ts(optional)]
    pub minimize_to_tray: Option<bool>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            auto_start: false,
            auto_pause_on_sleep: true,
            include_patches_in_reports: false,
            active_sinks: vec![SinkType::Csv],
            theme: Some("system".to_string()),
            text_and_icon_size: Some("medium".to_string()),
            gui_variant: Some("large".to_string()),
            always_on_top_small: Some(false),
            always_on_top_main: Some(false),
            minimize_to_tray: Some(true),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeConfig {
    pub id: String,
    pub runtime: String,
    pub config: String,
    pub created_at: String,
}

