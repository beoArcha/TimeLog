use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
#[serde(rename_all = "lowercase")]
#[ts(export)]
pub enum GuiSize {
    Small,
    Medium,
    Large,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
#[serde(rename_all = "lowercase")]
#[ts(export)]
pub enum TextAndIconSize {
    Small,
    Medium,
    Large,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct AlwaysOnTopConfig {
    pub small: bool,
    pub main: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, TS)]
#[ts(export)]
pub struct WindowDimensions {
    pub width: f64,
    pub height: f64,
}

impl GuiSize {
    pub fn get_dimensions(self, text_and_icon_size: TextAndIconSize) -> (WindowDimensions, bool) {
        match self {
            GuiSize::Small => (
                WindowDimensions {
                    width: 360.0,
                    height: 480.0,
                },
                false,
            ),
            GuiSize::Medium => {
                let dims = match text_and_icon_size {
                    TextAndIconSize::Small => WindowDimensions {
                        width: 540.0,
                        height: 720.0,
                    },
                    TextAndIconSize::Medium => WindowDimensions {
                        width: 630.0,
                        height: 840.0,
                    },
                    TextAndIconSize::Large => WindowDimensions {
                        width: 720.0,
                        height: 960.0,
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
