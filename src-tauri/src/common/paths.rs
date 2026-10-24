use crate::common::constants::{APPDATA, APP_NAME, CONFIG, DEFAULT_DB_NAME, HOME};
use std::path::{Path, PathBuf};

/// Resolves the default persistent SQLite database path for both native CLI and desktop instances.
/// Ensures the enclosing directory is created if not already present, propagating I/O errors.
pub fn try_get_default_db_path() -> std::io::Result<PathBuf> {
    let base_dir = std::env::var(APPDATA)
        .or_else(|_| std::env::var("AppData"))
        .map(PathBuf::from)
        .or_else(|_| std::env::var(HOME).map(|h| PathBuf::from(h).join(CONFIG)))
        .unwrap_or_else(|_| PathBuf::from("."));

    let app_dir = base_dir.join(APP_NAME);
    std::fs::create_dir_all(&app_dir)?;
    Ok(app_dir.join(DEFAULT_DB_NAME))
}

/// Resolves the default persistent SQLite database path, falling back if directory creation fails.
pub fn get_default_db_path() -> PathBuf {
    try_get_default_db_path().unwrap_or_else(|_| {
        let base_dir = std::env::var(APPDATA)
            .or_else(|_| std::env::var("AppData"))
            .map(PathBuf::from)
            .or_else(|_| std::env::var(HOME).map(|h| PathBuf::from(h).join(CONFIG)))
            .unwrap_or_else(|_| PathBuf::from("."));
        base_dir.join(APP_NAME).join(DEFAULT_DB_NAME)
    })
}

/// Resolves the default directory for CSV audit sinks.
pub fn get_default_csv_dir(db_path: &Path) -> PathBuf {
    db_path
        .parent()
        .map(|p| p.join("csv"))
        .unwrap_or_else(|| PathBuf::from("./csv"))
}

pub const ENV_OXY_DB_PATH: &str = "OXY_DB_PATH";

fn ensure_parent_dir_exists(path: &Path) -> std::io::Result<()> {
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent)?;
        }
    }
    Ok(())
}

/// Resolves the SQLite database path based on the precedence hierarchy:
/// 1. CLI explicit flag `--db <path>`
/// 2. Environment variable `OXY_DB_PATH`
/// 3. Operating system default user data directory
pub fn resolve_db_path(cli_override: Option<&str>) -> std::io::Result<PathBuf> {
    if let Some(path_str) = cli_override {
        let path = PathBuf::from(path_str);
        ensure_parent_dir_exists(&path)?;
        return Ok(path);
    }

    if let Ok(env_path) = std::env::var(ENV_OXY_DB_PATH) {
        let trimmed = env_path.trim();
        if !trimmed.is_empty() {
            let path = PathBuf::from(trimmed);
            ensure_parent_dir_exists(&path)?;
            return Ok(path);
        }
    }

    try_get_default_db_path()
}
