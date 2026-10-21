use crate::persistence::Persistence;
use crate::workflows::WorkflowDaemon;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::menu::{CheckMenuItem, MenuItem};

#[derive(Clone)]
pub struct TrayCheckHandles {
    pub toggle_visibility: MenuItem<tauri::Wry>,
    pub gui_compact: CheckMenuItem<tauri::Wry>,
    pub gui_medium: CheckMenuItem<tauri::Wry>,
    pub gui_full: CheckMenuItem<tauri::Wry>,
    pub toggle_on_top: CheckMenuItem<tauri::Wry>,
    pub toggle_minimize_to_tray: CheckMenuItem<tauri::Wry>,
    pub stop_all: MenuItem<tauri::Wry>,
    pub quit_app: MenuItem<tauri::Wry>,
}

pub struct AppState {
    pub persistence: Arc<Persistence>,
    pub was_maximized: std::sync::atomic::AtomicBool,
    pub minimize_to_tray: std::sync::atomic::AtomicBool,
    pub tray_handles: Option<TrayCheckHandles>,
    pub workflow_daemon: Arc<WorkflowDaemon>,
}

pub fn get_cli_db_path() -> PathBuf {
    crate::common::paths::get_default_db_path()
}
