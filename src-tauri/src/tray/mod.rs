pub mod localization;

use crate::types::GuiSize;
use localization::{get_text, TrayItem};
use tauri::{
    menu::MenuEvent,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    App, AppHandle, Emitter, Manager,
};

pub use crate::types::{FrontendEvent, Locale};

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

fn get_system_locale() -> Locale {
    let sys_lang = sys_locale::get_locale().unwrap_or_else(|| "en".to_string());
    Locale::from_sys_lang(&sys_lang)
}

fn create_menu_item<R: tauri::Runtime>(
    app: &App<R>,
    id: TrayMenuId,
    locale: Locale,
) -> tauri::Result<MenuItem<R>> {
    MenuItem::with_id(app, id.as_str(), id.get_text(locale), true, None::<&str>)
}

pub fn build_tray_menu<R: tauri::Runtime>(app: &App<R>) -> tauri::Result<Menu<R>> {
    let locale = get_system_locale();

    let toggle_item = create_menu_item(app, TrayMenuId::ToggleVisibility, locale)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let gui_small = create_menu_item(app, TrayMenuId::GuiSmall, locale)?;
    let gui_medium = create_menu_item(app, TrayMenuId::GuiMedium, locale)?;
    let gui_large = create_menu_item(app, TrayMenuId::GuiLarge, locale)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let toggle_on_top = create_menu_item(app, TrayMenuId::ToggleOnTop, locale)?;
    let stop_all = create_menu_item(app, TrayMenuId::StopAllTimers, locale)?;
    let sep3 = PredefinedMenuItem::separator(app)?;
    let quit_item = create_menu_item(app, TrayMenuId::QuitApp, locale)?;

    let tray_menu = Menu::with_items(
        app,
        &[
            &toggle_item,
            &sep1,
            &gui_small,
            &gui_medium,
            &gui_large,
            &sep2,
            &toggle_on_top,
            &stop_all,
            &sep3,
            &quit_item,
        ],
    )?;

    Ok(tray_menu)
}

fn emit_to_main<R: tauri::Runtime, S: serde::Serialize + Clone>(
    app: &AppHandle<R>,
    event: FrontendEvent,
    payload: S,
    show_and_focus: bool,
) {
    if let Some(window) = app.get_webview_window("main") {
        if show_and_focus {
            let _ = window.show();
            let _ = window.set_focus();
        }
        let _ = window.emit(event.as_str(), payload);
    }
}

pub fn handle_menu_event<R: tauri::Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    let id = event.id().as_ref();
    if let Some(menu_id) = TrayMenuId::from_str(id) {
        match menu_id {
            TrayMenuId::ToggleVisibility => {
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            TrayMenuId::GuiSmall => {
                emit_to_main(app, FrontendEvent::TraySetGuiVariant, GuiSize::Small, true);
            }
            TrayMenuId::GuiMedium => {
                emit_to_main(app, FrontendEvent::TraySetGuiVariant, GuiSize::Medium, true);
            }
            TrayMenuId::GuiLarge => {
                emit_to_main(app, FrontendEvent::TraySetGuiVariant, GuiSize::Large, true);
            }
            TrayMenuId::ToggleOnTop => {
                emit_to_main(app, FrontendEvent::TrayToggleOnTop, (), true);
            }
            TrayMenuId::StopAllTimers => {
                emit_to_main(app, FrontendEvent::TrayStopAllTimers, (), false);
            }
            TrayMenuId::QuitApp => {
                app.exit(0);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_str_round_trip() {
        let ids = [
            TrayMenuId::ToggleVisibility,
            TrayMenuId::GuiSmall,
            TrayMenuId::GuiMedium,
            TrayMenuId::GuiLarge,
            TrayMenuId::ToggleOnTop,
            TrayMenuId::StopAllTimers,
            TrayMenuId::QuitApp,
        ];
        for id in ids {
            let s = id.as_str();
            assert_eq!(
                TrayMenuId::from_str(s),
                Some(id),
                "from_str({s}) should round-trip"
            );
        }
    }

    #[test]
    fn test_from_str_unknown_returns_none() {
        assert_eq!(TrayMenuId::from_str("unknown_id"), None);
        assert_eq!(TrayMenuId::from_str(""), None);
    }

    #[test]
    fn test_get_text_delegates_to_localization() {
        // Spot-check a few — full coverage is in localization tests
        assert_eq!(TrayMenuId::QuitApp.get_text(Locale::En), "Quit Completely");
        assert_eq!(TrayMenuId::QuitApp.get_text(Locale::Pl), "Wyjdź całkowicie");
    }
}
