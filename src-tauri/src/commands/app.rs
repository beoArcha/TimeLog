use crate::AppState;
use tauri::{AppHandle, State};

#[tauri::command]
pub fn exit_app(app_handle: AppHandle) {
    app_handle.exit(0);
}

#[tauri::command]
pub fn set_minimize_to_tray(minimize: bool, state: State<'_, AppState>) {
    state
        .minimize_to_tray
        .store(minimize, std::sync::atomic::Ordering::Relaxed);
    crate::tray::update_tray_minimize_to_tray(&state, minimize);
}
