use crate::types::GuiVariant;
use tauri::{
    menu::MenuEvent,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    App, AppHandle, Emitter, Manager,
};

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
}

pub use crate::types::FrontendEvent;

fn get_system_locale() -> String {
    sys_locale::get_locale()
        .unwrap_or_else(|| "en".to_string())
        .split('-')
        .next()
        .unwrap_or("en")
        .to_lowercase()
}

fn get_translation(locale: &str, key: &str) -> &'static str {
    match locale {
        "pl" => match key {
            "show_hide" => "Pokaż / Ukryj okno",
            "gui_small" => "GUI: Mały",
            "gui_medium" => "GUI: Średni",
            "gui_large" => "GUI: Duży",
            "always_on_top" => "Zawsze na wierzchu",
            "stop_all" => "Zatrzymaj wszystkie timery",
            "quit" => "Wyjdź całkowicie",
            _ => "",
        },
        "de" => match key {
            "show_hide" => "Fenster anzeigen / ausblenden",
            "gui_small" => "GUI: Klein",
            "gui_medium" => "GUI: Mittel",
            "gui_large" => "GUI: Groß",
            "always_on_top" => "Immer im Vordergrund",
            "stop_all" => "Alle Timer stoppen",
            "quit" => "Vollständig beenden",
            _ => "",
        },
        "fr" => match key {
            "show_hide" => "Afficher / Masquer la fenêtre",
            "gui_small" => "GUI: Petit",
            "gui_medium" => "GUI: Moyen",
            "gui_large" => "GUI: Grand",
            "always_on_top" => "Toujours au premier plan",
            "stop_all" => "Arrêter tous les minuteurs",
            "quit" => "Quitter complètement",
            _ => "",
        },
        "es" => match key {
            "show_hide" => "Mostrar / Ocultar ventana",
            "gui_small" => "GUI: Pequeño",
            "gui_medium" => "GUI: Mediano",
            "gui_large" => "GUI: Grande",
            "always_on_top" => "Siempre en primer plano",
            "stop_all" => "Detener todos los temporizadores",
            "quit" => "Salir completamente",
            _ => "",
        },
        "pt" => match key {
            "show_hide" => "Mostrar / Ocultar janela",
            "gui_small" => "GUI: Pequeno",
            "gui_medium" => "GUI: Médio",
            "gui_large" => "GUI: Grande",
            "always_on_top" => "Sempre no topo",
            "stop_all" => "Parar todos os cronômetros",
            "quit" => "Sair completamente",
            _ => "",
        },
        _ => match key {
            "show_hide" => "Show / Hide Window",
            "gui_small" => "GUI: Small",
            "gui_medium" => "GUI: Medium",
            "gui_large" => "GUI: Large",
            "always_on_top" => "Always on Top",
            "stop_all" => "Stop All Timers",
            "quit" => "Quit Completely",
            _ => "",
        },
    }
}

pub fn build_tray_menu<R: tauri::Runtime>(app: &App<R>) -> tauri::Result<Menu<R>> {
    let locale = get_system_locale();

    let toggle_item = MenuItem::with_id(
        app,
        TrayMenuId::ToggleVisibility.as_str(),
        get_translation(&locale, "show_hide"),
        true,
        None::<&str>,
    )?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let gui_small = MenuItem::with_id(
        app,
        TrayMenuId::GuiSmall.as_str(),
        get_translation(&locale, "gui_small"),
        true,
        None::<&str>,
    )?;
    let gui_medium = MenuItem::with_id(
        app,
        TrayMenuId::GuiMedium.as_str(),
        get_translation(&locale, "gui_medium"),
        true,
        None::<&str>,
    )?;
    let gui_large = MenuItem::with_id(
        app,
        TrayMenuId::GuiLarge.as_str(),
        get_translation(&locale, "gui_large"),
        true,
        None::<&str>,
    )?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let toggle_on_top = MenuItem::with_id(
        app,
        TrayMenuId::ToggleOnTop.as_str(),
        get_translation(&locale, "always_on_top"),
        true,
        None::<&str>,
    )?;
    let stop_all = MenuItem::with_id(
        app,
        TrayMenuId::StopAllTimers.as_str(),
        get_translation(&locale, "stop_all"),
        true,
        None::<&str>,
    )?;
    let sep3 = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(
        app,
        TrayMenuId::QuitApp.as_str(),
        get_translation(&locale, "quit"),
        true,
        None::<&str>,
    )?;

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
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = app.emit(FrontendEvent::TraySetGuiVariant.as_str(), GuiVariant::Small);
                }
            }
            TrayMenuId::GuiMedium => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = app.emit(
                        FrontendEvent::TraySetGuiVariant.as_str(),
                        GuiVariant::Medium,
                    );
                }
            }
            TrayMenuId::GuiLarge => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = app.emit(FrontendEvent::TraySetGuiVariant.as_str(), GuiVariant::Large);
                }
            }
            TrayMenuId::ToggleOnTop => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = app.emit(FrontendEvent::TrayToggleOnTop.as_str(), ());
                }
            }
            TrayMenuId::StopAllTimers => {
                let _ = app.emit(FrontendEvent::TrayStopAllTimers.as_str(), ());
            }
            TrayMenuId::QuitApp => {
                app.exit(0);
            }
        }
    }
}
