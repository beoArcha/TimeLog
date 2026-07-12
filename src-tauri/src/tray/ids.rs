use crate::tray::localization::{get_text, TrayItem};
use crate::types::Locale;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrayMenuId {
    ToggleVisibility,
    GuiCompact,
    GuiMedium,
    GuiFull,
    ToggleOnTop,
    StopAllTimers,
    QuitApp,
}

impl TrayMenuId {
    pub fn as_str(self) -> &'static str {
        match self {
            TrayMenuId::ToggleVisibility => "toggle_vis",
            TrayMenuId::GuiCompact => "gui_compact",
            TrayMenuId::GuiMedium => "gui_medium",
            TrayMenuId::GuiFull => "gui_full",
            TrayMenuId::ToggleOnTop => "toggle_on_top",
            TrayMenuId::StopAllTimers => "stop_all",
            TrayMenuId::QuitApp => "quit_app",
        }
    }

    #[allow(clippy::should_implement_trait)]
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "toggle_vis" => Some(TrayMenuId::ToggleVisibility),
            "gui_compact" => Some(TrayMenuId::GuiCompact),
            "gui_medium" => Some(TrayMenuId::GuiMedium),
            "gui_full" => Some(TrayMenuId::GuiFull),
            "toggle_on_top" => Some(TrayMenuId::ToggleOnTop),
            "stop_all" => Some(TrayMenuId::StopAllTimers),
            "quit_app" => Some(TrayMenuId::QuitApp),
            _ => None,
        }
    }

    fn as_tray_item(self) -> TrayItem {
        match self {
            TrayMenuId::ToggleVisibility => TrayItem::ToggleVisibility,
            TrayMenuId::GuiCompact => TrayItem::GuiCompact,
            TrayMenuId::GuiMedium => TrayItem::GuiMedium,
            TrayMenuId::GuiFull => TrayItem::GuiFull,
            TrayMenuId::ToggleOnTop => TrayItem::ToggleOnTop,
            TrayMenuId::StopAllTimers => TrayItem::StopAllTimers,
            TrayMenuId::QuitApp => TrayItem::QuitApp,
        }
    }

    pub fn get_text(self, locale: Locale) -> &'static str {
        get_text(self.as_tray_item(), locale)
    }
}
