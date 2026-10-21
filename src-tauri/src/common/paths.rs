use crate::common::constants::{APPDATA, APP_NAME, CONFIG, DEFAULT_DB_NAME, HOME};
use std::path::{Path, PathBuf};

/// Resolves the default persistent SQLite database path for both native CLI and desktop instances.
/// Ensures the enclosing directory is created if not already present.
pub fn get_default_db_path() -> PathBuf {
    let base_dir = std::env::var(APPDATA)
        .or_else(|_| std::env::var("AppData"))
        .map(PathBuf::from)
        .or_else(|_| std::env::var(HOME).map(|h| PathBuf::from(h).join(CONFIG)))
        .unwrap_or_else(|_| PathBuf::from("."));

    let app_dir = base_dir.join(APP_NAME);
    let _ = std::fs::create_dir_all(&app_dir);
    app_dir.join(DEFAULT_DB_NAME)
}

/// Resolves the default directory for CSV audit sinks.
pub fn get_default_csv_dir(db_path: &Path) -> PathBuf {
    db_path
        .parent()
        .map(|p| p.join("csv"))
        .unwrap_or_else(|| PathBuf::from("./csv"))
}
