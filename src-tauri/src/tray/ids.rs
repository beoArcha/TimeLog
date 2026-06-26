use crate::tray::localization::{get_text, TrayItem};
use crate::types::Locale;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrayMenuId {
    ToggleVisibility,
    GuiSmall,
    GuiMedium,
    GuiLarge,
    ToggleOnTop,
    StopAllTimers,
    QuitApp,
}

impl TrayMenuId {
    pub fn as_str(self) -> &'static str {
        match self {
            TrayMenuId::ToggleVisibility => "toggle_vis",
            TrayMenuId::GuiSmall => "gui_small",
            TrayMenuId::GuiMedium => "gui_medium",
            TrayMenuId::GuiLarge => "gui_large",
            TrayMenuId::ToggleOnTop => "toggle_on_top",
            TrayMenuId::StopAllTimers => "stop_all",
            TrayMenuId::QuitApp => "quit_app",
        }
    }

    #[allow(clippy::should_implement_trait)]
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "toggle_vis" => Some(TrayMenuId::ToggleVisibility),
            "gui_small" => Some(TrayMenuId::GuiSmall),
            "gui_medium" => Some(TrayMenuId::GuiMedium),
            "gui_large" => Some(TrayMenuId::GuiLarge),
            "toggle_on_top" => Some(TrayMenuId::ToggleOnTop),
            "stop_all" => Some(TrayMenuId::StopAllTimers),
            "quit_app" => Some(TrayMenuId::QuitApp),
            _ => None,
        }
    }

    fn as_tray_item(self) -> TrayItem {
        match self {
            TrayMenuId::ToggleVisibility => TrayItem::ToggleVisibility,
            TrayMenuId::GuiSmall => TrayItem::GuiSmall,
            TrayMenuId::GuiMedium => TrayItem::GuiMedium,
            TrayMenuId::GuiLarge => TrayItem::GuiLarge,
            TrayMenuId::ToggleOnTop => TrayItem::ToggleOnTop,
            TrayMenuId::StopAllTimers => TrayItem::StopAllTimers,
            TrayMenuId::QuitApp => TrayItem::QuitApp,
        }
    }

    pub fn get_text(self, locale: Locale) -> &'static str {
        get_text(self.as_tray_item(), locale)
    }
}
