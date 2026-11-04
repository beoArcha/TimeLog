use crate::common::constants::{APPDATA, BUNDLE_IDENTIFIER, DEFAULT_DB_NAME};
use std::path::{Path, PathBuf};

/// Resolves the base data directory for a specific operating system, reading environment variables via `get_env`.
///
/// Precedence per OS:
/// - Windows: `%APPDATA%` (AppData\Roaming)
/// - macOS: `$HOME/Library/Application Support`
/// - Linux & Unix: `$XDG_DATA_HOME` falling back to `$HOME/.local/share`
pub fn resolve_os_data_dir_with_env<F>(target_os: &str, get_env: F) -> PathBuf
where
    F: Fn(&str) -> Option<String>,
{
    match target_os {
        "windows" => get_env(APPDATA)
            .or_else(|| get_env("AppData"))
            .map(PathBuf::from)
            .unwrap_or_else(|| PathBuf::from(".")),
        "macos" => {
            if let Some(home) = get_env("HOME") {
                PathBuf::from(home)
                    .join("Library")
                    .join("Application Support")
            } else {
                PathBuf::from(".")
            }
        }
        _ => {
            if let Some(xdg) = get_env("XDG_DATA_HOME") {
                let trimmed = xdg.trim();
                if !trimmed.is_empty() {
                    return PathBuf::from(trimmed);
                }
            }
            if let Some(home) = get_env("HOME") {
                PathBuf::from(home).join(".local").join("share")
            } else {
                PathBuf::from(".")
            }
        }
    }
}

/// Resolves the current operating system's native base user data directory.
pub fn resolve_system_data_dir() -> PathBuf {
    let os = std::env::consts::OS;
    resolve_os_data_dir_with_env(os, |k| std::env::var(k).ok())
}

/// Resolves the default persistent SQLite database path for both native CLI and desktop instances.
/// Ensures the enclosing directory is created if not already present, propagating I/O errors.
pub fn try_get_default_db_path() -> std::io::Result<PathBuf> {
    let base_dir = resolve_system_data_dir();
    let app_dir = base_dir.join(BUNDLE_IDENTIFIER);
    std::fs::create_dir_all(&app_dir)?;
    Ok(app_dir.join(DEFAULT_DB_NAME))
}

/// Resolves the default persistent SQLite database path, falling back if directory creation fails.
pub fn get_default_db_path() -> PathBuf {
    try_get_default_db_path().unwrap_or_else(|_| {
        let base_dir = resolve_system_data_dir();
        base_dir.join(BUNDLE_IDENTIFIER).join(DEFAULT_DB_NAME)
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
