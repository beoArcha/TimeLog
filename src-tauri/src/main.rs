//! LogTime by OxyFlow Tauri v2 Application Daemon & Interface Entry.
//! This handles background timer state and custom window close interception
//! keeping the system alive in the tray when the main webview is invisible.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Emitter, menu::{Menu, MenuItem, PredefinedMenuItem}, tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState}};
use std::sync::Mutex;
use std::error::Error;
use std::path::PathBuf;
use clap::Parser;

mod engine;
mod cli;

struct AppState {
    db_conn: Mutex<rusqlite::Connection>,
    was_maximized: std::sync::atomic::AtomicBool,
}

#[tauri::command]
fn start_timer(task_id: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let conn = state.db_conn.lock().unwrap();
    // Stop other timers on same project, start new log entry (parallel projects friendly)
    engine::counting::start_project_timer(&conn, &task_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn stop_timer(project_id: Option<String>, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let conn = state.db_conn.lock().unwrap();
    engine::counting::stop_project_timer(&conn, project_id.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_active_logs(state: tauri::State<'_, AppState>) -> Result<Vec<String>, String> {
    let conn = state.db_conn.lock().unwrap();
    engine::counting::query_active_logs(&conn)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn resize_window(width: f64, height: f64, window: tauri::Window) -> Result<(), String> {
    window.set_size(tauri::Size::Logical(tauri::LogicalSize::new(width, height)))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_always_on_top(always_on_top: bool, window: tauri::Window) -> Result<(), String> {
    window.set_always_on_top(always_on_top)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn minimize_window(window: tauri::Window) -> Result<(), String> {
    window.minimize()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn close_window(window: tauri::Window) -> Result<(), String> {
    window.close()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn hide_window(window: tauri::Window) -> Result<(), String> {
    window.hide()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn show_window(window: tauri::Window) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn set_window_resizable(resizable: bool, window: tauri::Window) -> Result<(), String> {
    window.set_resizable(resizable)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn exit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

fn get_cli_db_path() -> PathBuf {
    let base_dir = std::env::var("APPDATA")
        .map(PathBuf::from)
        .or_else(|_| std::env::var("HOME").map(|h| PathBuf::from(h).join(".config")))
        .unwrap_or_else(|_| PathBuf::from("."));
    
    let app_dir = base_dir.join("LogTime by OxyFlow");
    let _ = std::fs::create_dir_all(&app_dir);
    app_dir.join("oxytime.db")
}

fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = std::env::args().collect();

    if args.len() > 1 {
        let db_path = get_cli_db_path();
        let db = engine::db::init_db(&db_path)?;
        if let Ok(cli_args) = cli::CliArgs::try_parse() {
            cli::handle_cli(cli_args, &db)?;
            return Ok(());
        }
    }
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            start_timer,
            stop_timer,
            get_active_logs,
            resize_window,
            set_always_on_top,
            minimize_window,
            close_window,
            hide_window,
            show_window,
            set_window_resizable,
            exit_app
        ])
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;
            let db_path = app_data_dir.join("oxytime.db");

            let db = engine::db::init_db(&db_path)?;
            app.manage(AppState {
                db_conn: Mutex::new(db),
                was_maximized: std::sync::atomic::AtomicBool::new(false),
            });

            // --- Tray Menu Items ---
            let toggle_item = MenuItem::with_id(app, "toggle_vis", "Pokaż / Ukryj okno", true, None::<&str>)?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let gui_small = MenuItem::with_id(app, "gui_small", "GUI: Mały", true, None::<&str>)?;
            let gui_medium = MenuItem::with_id(app, "gui_medium", "GUI: Średni", true, None::<&str>)?;
            let gui_large = MenuItem::with_id(app, "gui_large", "GUI: Duży", true, None::<&str>)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let toggle_on_top = MenuItem::with_id(app, "toggle_on_top", "Zawsze na wierzchu", true, None::<&str>)?;
            let stop_all = MenuItem::with_id(app, "stop_all", "Zatrzymaj wszystkie timery", true, None::<&str>)?;
            let sep3 = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItem::with_id(app, "quit_app", "Wyjdź całkowicie", true, None::<&str>)?;
            
            let tray_menu = Menu::with_items(app, &[
                &toggle_item, &sep1,
                &gui_small, &gui_medium, &gui_large, &sep2,
                &toggle_on_top, &stop_all, &sep3,
                &quit_item
            ])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("LogTime by OxyFlow")
                .menu(&tray_menu)
                .on_menu_event(|app, event| {
                    let id = event.id().as_ref();
                    match id {
                        "toggle_vis" => {
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        "gui_small" | "gui_medium" | "gui_large" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let variant = id.strip_prefix("gui_").unwrap_or("large");
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = app.emit("tray-set-gui-variant", variant);
                            }
                        }
                        "toggle_on_top" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = app.emit("tray-toggle-on-top", ());
                            }
                        }
                        "stop_all" => {
                            let _ = app.emit("tray-stop-all-timers", ());
                        }
                        "quit_app" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
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
                    let _ = window.app_handle().emit("native-close-requested", ());
                }
                tauri::WindowEvent::Resized(_) => {
                    let is_max = window.is_maximized().unwrap_or(false);
                    let was_max = state.was_maximized.load(std::sync::atomic::Ordering::Relaxed);
                    
                    if is_max && !was_max {
                        state.was_maximized.store(true, std::sync::atomic::Ordering::Relaxed);
                        let _ = window.app_handle().emit("native-window-maximized", ());
                    } else if !is_max && was_max {
                        state.was_maximized.store(false, std::sync::atomic::Ordering::Relaxed);
                        let _ = window.app_handle().emit("native-window-restored", ());
                    } else if let Ok(true) = window.is_minimized() {
                        let _ = window.unminimize();
                        let _ = window.app_handle().emit("native-window-minimized", ());
                    } else if !is_max {
                        if let Ok(size) = window.inner_size() {
                            let scale_factor = window.scale_factor().unwrap_or(1.0);
                            let logical_width = size.width as f64 / scale_factor;
                            let logical_height = size.height as f64 / scale_factor;
                            let _ = window.app_handle().emit("native-window-resized", (logical_width, logical_height));
                        }
                    }
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;  
    use std::sync::Mutex;
    use crate::engine::db::init_db_in_memory;

    #[test]
    fn test_app_state_and_commands() -> Result<(), String> {
        // Here we test the direct functional logic behind commands locally, bypassing Tauri state wrapper
        let conn = init_db_in_memory().map_err(|e| e.to_string())?;
        
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute("INSERT INTO projects (id, name, color, created_at) VALUES ('p_main', 'Main Proj', 'green', ?)", [&now]).map_err(|e| e.to_string())?;
        conn.execute("INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t_main', 'p_main', 'Main Task', ?)", [&now]).map_err(|e| e.to_string())?;

        // Test inner logic normally dispatched by command
        crate::engine::counting::start_project_timer(&conn, "t_main").map_err(|e| e.to_string())?;
        
        let active = crate::engine::counting::query_active_logs(&conn).map_err(|e| e.to_string())?;
        assert_eq!(active.len(), 1);

        crate::engine::counting::stop_project_timer(&conn, Some("p_main")).map_err(|e| e.to_string())?;

        let active_after = crate::engine::counting::query_active_logs(&conn).map_err(|e| e.to_string())?;
        assert_eq!(active_after.len(), 0);
        
        Ok(())
    }
}
