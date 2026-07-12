use crate::tray::ids::TrayMenuId;
use crate::types::{FrontendEvent, LayoutVariant};
use tauri::{menu::MenuEvent, AppHandle, Emitter, Manager};

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
            TrayMenuId::GuiCompact => {
                emit_to_main(
                    app,
                    FrontendEvent::TraySetGuiVariant,
                    LayoutVariant::Compact,
                    true,
                );
            }
            TrayMenuId::GuiMedium => {
                emit_to_main(
                    app,
                    FrontendEvent::TraySetGuiVariant,
                    LayoutVariant::Medium,
                    true,
                );
            }
            TrayMenuId::GuiFull => {
                emit_to_main(
                    app,
                    FrontendEvent::TraySetGuiVariant,
                    LayoutVariant::Full,
                    true,
                );
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
