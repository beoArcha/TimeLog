//! LogTime by OxyFlow Tauri v2 Application Daemon & Interface Entry.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Emitter, tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState}};
use std::sync::Mutex;
use std::error::Error;
use std::path::PathBuf;
use clap::Parser;

mod engine;
mod cli;
mod types;
mod errors;
mod commands;
mod tray;

pub struct AppState {
    pub db_conn: Mutex<rusqlite::Connection>,
    pub was_maximized: std::sync::atomic::AtomicBool,
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
            commands::start_timer,
            commands::stop_timer,
            commands::get_active_logs,
            commands::resize_window,
            commands::set_always_on_top,
            commands::minimize_window,
            commands::close_window,
            commands::hide_window,
            commands::show_window,
            commands::set_window_resizable,
            commands::exit_app
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

            // Composed tray icon building and menu event dispatching
            let tray_menu = tray::build_tray_menu(app)?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("LogTime by OxyFlow")
                .menu(&tray_menu)
                .on_menu_event(tray::handle_menu_event)
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
                    let _ = window.app_handle().emit(tray::FrontendEvent::NativeCloseRequested.as_str(), ());
                }
                tauri::WindowEvent::Resized(_) => {
                    let is_max = window.is_maximized().unwrap_or(false);
                    let was_max = state.was_maximized.load(std::sync::atomic::Ordering::Relaxed);
                    
                    if is_max && !was_max {
                        state.was_maximized.store(true, std::sync::atomic::Ordering::Relaxed);
                        let _ = window.app_handle().emit(tray::FrontendEvent::NativeWindowMaximized.as_str(), ());
                    } else if !is_max && was_max {
                        state.was_maximized.store(false, std::sync::atomic::Ordering::Relaxed);
                        let _ = window.app_handle().emit(tray::FrontendEvent::NativeWindowRestored.as_str(), ());
                    } else if let Ok(true) = window.is_minimized() {
                        let _ = window.unminimize();
                        let _ = window.app_handle().emit(tray::FrontendEvent::NativeWindowMinimized.as_str(), ());
                    } else if !is_max {
                        if let Ok(size) = window.inner_size() {
                            let scale_factor = window.scale_factor().unwrap_or(1.0);
                            let logical_width = size.width as f64 / scale_factor;
                            let logical_height = size.height as f64 / scale_factor;
                            let _ = window.app_handle().emit(tray::FrontendEvent::NativeWindowResized.as_str(), (logical_width, logical_height));
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
