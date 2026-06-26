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

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, TS)]
#[ts(export_to = "../../src/bindings/WindowDimensions.ts")]
pub struct WindowDimensions {
    pub width: f64,
    pub height: f64,
}

impl GuiSize {
    pub fn get_dimensions(self, text_and_icon_size: TextAndIconSize) -> (WindowDimensions, bool) {
        match self {
            GuiSize::Small => (
                WindowDimensions {
                    width: 340.0,
                    height: 520.0,
                },
                false,
            ),
            GuiSize::Medium => {
                let dims = match text_and_icon_size {
                    TextAndIconSize::Small => WindowDimensions {
                        width: 400.0,
                        height: 620.0,
                    },
                    TextAndIconSize::Medium => WindowDimensions {
                        width: 440.0,
                        height: 660.0,
                    },
                    TextAndIconSize::Large => WindowDimensions {
                        width: 480.0,
                        height: 700.0,
                    },
                };
                (dims, true)
            }
            GuiSize::Large => {
                let dims = match text_and_icon_size {
                    TextAndIconSize::Small => WindowDimensions {
                        width: 850.0,
                        height: 600.0,
                    },
                    TextAndIconSize::Medium => WindowDimensions {
                        width: 950.0,
                        height: 680.0,
                    },
                    TextAndIconSize::Large => WindowDimensions {
                        width: 1050.0,
                        height: 750.0,
                    },
                };
                (dims, true)
            }
        }
    }
}
