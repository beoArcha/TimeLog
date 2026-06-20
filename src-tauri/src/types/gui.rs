use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
#[serde(rename_all = "lowercase")]
#[ts(export_to = "../../src/bindings/GuiSize.ts")]
pub enum GuiSize {
    Small,
    Medium,
    Large,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
#[serde(rename_all = "lowercase")]
#[ts(export_to = "../../src/bindings/TextAndIconSize.ts")]
pub enum TextAndIconSize {
    Small,
    Medium,
    Large,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/AlwaysOnTopConfig.ts")]
pub struct AlwaysOnTopConfig {
    pub small: bool,
    pub main: bool,
}
