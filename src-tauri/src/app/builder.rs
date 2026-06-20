use crate::app::state::AppState;
use crate::commands;
use crate::common::constants::*;
use crate::engine;
use crate::tray;
use crate::types::FrontendEvent;
use std::sync::Mutex;
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

pub fn create_builder() -> tauri::Builder<tauri::Wry> {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::timer::start_timer,
            commands::timer::stop_timer,
            commands::timer::get_active_logs,
            commands::window::set_gui_size,
            commands::window::resize_window,
            commands::window::set_always_on_top,
            commands::window::minimize_window,
            commands::window::close_window,
            commands::window::hide_window,
            commands::window::show_window,
            commands::window::set_window_resizable,
            commands::app::exit_app,
            commands::app::set_minimize_to_tray
        ])
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;
            let db_path = app_data_dir.join(DEFAULT_DB_NAME);

            let db = engine::db::init_db(&db_path)?;
            app.manage(AppState {
                db_conn: Mutex::new(db),
                was_maximized: std::sync::atomic::AtomicBool::new(false),
                minimize_to_tray: std::sync::atomic::AtomicBool::new(true),
            });

            let tray_menu = tray::build_tray_menu(app)?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip(APP_NAME)
                .menu(&tray_menu)
                .on_menu_event(tray::handle_menu_event)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            let state = window.state::<AppState>();
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    api.prevent_close();
                    if state
                        .minimize_to_tray
                        .load(std::sync::atomic::Ordering::Relaxed)
                    {
                        let _ = window.hide();
                    } else {
                        window.app_handle().exit(0);
                    }
                }
                tauri::WindowEvent::Resized(_) => {
                    let is_max = window.is_maximized().unwrap_or(false);
                    let was_max = state
                        .was_maximized
                        .load(std::sync::atomic::Ordering::Relaxed);

                    if is_max && !was_max {
                        state
                            .was_maximized
                            .store(true, std::sync::atomic::Ordering::Relaxed);
                        let _ = window
                            .app_handle()
                            .emit(FrontendEvent::NativeWindowMaximized.as_str(), ());
                    } else if !is_max && was_max {
                        state
                            .was_maximized
                            .store(false, std::sync::atomic::Ordering::Relaxed);
                        let _ = window
                            .app_handle()
                            .emit(FrontendEvent::NativeWindowRestored.as_str(), ());
                    } else if let Ok(true) = window.is_minimized() {
                        let _ = window.unminimize();
                        let _ = window
                            .app_handle()
                            .emit(FrontendEvent::NativeWindowMinimized.as_str(), ());
                    } else if !is_max {
                        if let Ok(size) = window.inner_size() {
                            let scale_factor = window.scale_factor().unwrap_or(1.0);
                            let logical_width = size.width as f64 / scale_factor;
                            let logical_height = size.height as f64 / scale_factor;
                            let _ = window.app_handle().emit(
                                FrontendEvent::NativeWindowResized.as_str(),
                                (logical_width, logical_height),
                            );
                        }
                    }
                }
                _ => {}
            }
        })
}

pub fn run_tauri() {
    create_builder()
        .run(tauri::generate_context!())
        .expect(APP_ERROR);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_builder_initialization() {
        let _builder = create_builder();
    }
}
