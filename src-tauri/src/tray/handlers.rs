use crate::app::state::AppState;
use crate::tray::ids::TrayMenuId;
use crate::types::{FrontendEvent, LayoutVariant};
use tauri::{menu::MenuEvent, AppHandle, Emitter, Manager};

pub fn update_tray_gui_variant(state: &AppState, variant: LayoutVariant) {
    if let Some(ref handles) = state.tray_handles {
        let _ = handles
            .gui_compact
            .set_checked(variant == LayoutVariant::Compact);
        let _ = handles
            .gui_medium
            .set_checked(variant == LayoutVariant::Medium);
        let _ = handles.gui_full.set_checked(variant == LayoutVariant::Full);
    }
}

pub fn update_tray_always_on_top(state: &AppState, on_top: bool) {
    if let Some(ref handles) = state.tray_handles {
        let _ = handles.toggle_on_top.set_checked(on_top);
    }
}

pub fn update_tray_minimize_to_tray(state: &AppState, enabled: bool) {
    if let Some(ref handles) = state.tray_handles {
        let _ = handles.toggle_minimize_to_tray.set_checked(enabled);
    }
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
        let _ = window.emit(event.as_str(), payload.clone());
    }
    let _ = app.emit(event.as_str(), payload);
}

pub fn handle_menu_event<R: tauri::Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    let id = event.id().as_ref();
    if let Some(menu_id) = TrayMenuId::from_str(id) {
        let state = app.state::<AppState>();
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
                update_tray_gui_variant(&state, LayoutVariant::Compact);
                emit_to_main(
                    app,
                    FrontendEvent::TraySetGuiVariant,
                    LayoutVariant::Compact,
                    true,
                );
            }
            TrayMenuId::GuiMedium => {
                update_tray_gui_variant(&state, LayoutVariant::Medium);
                emit_to_main(
                    app,
                    FrontendEvent::TraySetGuiVariant,
                    LayoutVariant::Medium,
                    true,
                );
            }
            TrayMenuId::GuiFull => {
                update_tray_gui_variant(&state, LayoutVariant::Full);
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
            TrayMenuId::ToggleMinimizeToTray => {
                let current = state
                    .minimize_to_tray
                    .load(std::sync::atomic::Ordering::Relaxed);
                let next = !current;
                state
                    .minimize_to_tray
                    .store(next, std::sync::atomic::Ordering::Relaxed);
                update_tray_minimize_to_tray(&state, next);
                emit_to_main(app, FrontendEvent::TrayToggleMinimizeToTray, next, false);
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
