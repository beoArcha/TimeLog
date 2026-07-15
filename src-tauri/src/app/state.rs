use crate::common::constants::*;
use crate::persistence::Persistence;
use std::path::PathBuf;
use std::sync::Arc;

pub struct AppState {
    pub persistence: Arc<Persistence>,
    pub was_maximized: std::sync::atomic::AtomicBool,
    pub minimize_to_tray: std::sync::atomic::AtomicBool,
}

pub fn get_cli_db_path() -> PathBuf {
    let base_dir = std::env::var(APPDATA)
        .map(PathBuf::from)
        .or_else(|_| std::env::var(HOME).map(|h| PathBuf::from(h).join(CONFIG)))
        .unwrap_or_else(|_| PathBuf::from("."));

    let app_dir = base_dir.join(APP_NAME);
    let _ = std::fs::create_dir_all(&app_dir);
    app_dir.join(DEFAULT_DB_NAME)
}
