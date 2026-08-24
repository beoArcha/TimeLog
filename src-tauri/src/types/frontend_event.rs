use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
#[serde(rename_all = "kebab-case")]
#[ts(export)]
pub enum FrontendEvent {
    TraySetGuiVariant,
    TrayToggleOnTop,
    TrayToggleMinimizeToTray,
    TrayStopAllTimers,
    NativeCloseRequested,
    NativeWindowMaximized,
    NativeWindowRestored,
    NativeWindowMinimized,
    NativeWindowResized,
}

impl FrontendEvent {
    pub fn as_str(self) -> &'static str {
        match self {
            FrontendEvent::TraySetGuiVariant => "tray-set-gui-variant",
            FrontendEvent::TrayToggleOnTop => "tray-toggle-on-top",
            FrontendEvent::TrayToggleMinimizeToTray => "tray-toggle-minimize-to-tray",
            FrontendEvent::TrayStopAllTimers => "tray-stop-all-timers",
            FrontendEvent::NativeCloseRequested => "native-close-requested",
            FrontendEvent::NativeWindowMaximized => "native-window-maximized",
            FrontendEvent::NativeWindowRestored => "native-window-restored",
            FrontendEvent::NativeWindowMinimized => "native-window-minimized",
            FrontendEvent::NativeWindowResized => "native-window-resized",
        }
    }
}
