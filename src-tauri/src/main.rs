//! OxyFlow Tauri v2 Application Daemon & Interface Entry.
//! This handles background timer state and custom window close interception
//! keeping the system alive in the tray when the main webview is invisible.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};
use std::sync::Mutex;
use std::error::Error;

mod engine;

struct AppState {
    db_conn: Mutex<rusqlite::Connection>,
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

fn main() -> Result<(), Box<dyn Error>> {
    let db = engine::db::init_db()?;

    tauri::Builder::default()
        .manage(AppState {
            db_conn: Mutex::new(db),
        })
        .invoke_handler(tauri::generate_handler![
            start_timer,
            stop_timer,
            get_active_logs
        ])
        .setup(|app| {
            // 1. Build beautiful tray menus to restore or fully exit
            let toggle_item = MenuItem::with_id(app, "toggle_vis", "Pokaż OxyFlow", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit_app", "Wyjdź całkowicie", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&toggle_item, &quit_item])?;

            // 2. Register native System Tray with custom callback handler
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .on_menu_event(|app, event| {
                    if event.id().as_ref() == "toggle_vis" {
                        if let Some(window) = app.get_webview_window("main") {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    } else if event.id().as_ref() == "quit_app" {
                        app.exit(0);
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // IMPORTANT: INSTEAD OF TERMINATING, NATIVELY HIDE INTERFACE!
                // Closing does NOT terminate counting because the Rust Engine process stays alive in the Tray loop!
                window.hide().unwrap();
                api.prevent_close();
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
