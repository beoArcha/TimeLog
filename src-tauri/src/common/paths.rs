use crate::common::constants::{APPDATA, BUNDLE_IDENTIFIER, DEFAULT_DB_NAME};
use std::path::{Path, PathBuf};

/// Checks whether a path is absolute according to the specified target operating system.
pub fn is_path_absolute_for_os(path: &Path, target_os: &str) -> bool {
    let Some(value) = path.to_str() else {
        return false;
    };

    match target_os {
        "windows" => {
            let bytes = value.as_bytes();
            let has_drive_prefix = bytes.len() >= 3
                && bytes[0].is_ascii_alphabetic()
                && bytes[1] == b':'
                && matches!(bytes[2], b'\\' | b'/');

            let unc_parts = value
                .strip_prefix("\\\\")
                .or_else(|| value.strip_prefix("//"))
                .map(|unc| {
                    unc.split(['\\\\', '/'])
                        .filter(|part| !part.is_empty())
                        .collect::<Vec<_>>()
                });

            has_drive_prefix || unc_parts.map_or(false, |parts| parts.len() >= 2)
        }
        "linux" | "macos" => value.starts_with('/'),
        _ => path.is_absolute(),
    }
}

/// Checks absoluteness using the current host operating system.
pub fn is_path_absolute(path: &Path) -> bool {
    is_path_absolute_for_os(path, std::env::consts::OS)
}

/// Resolves the base data directory for a specific operating system, reading environment variables via `get_env`.
///
/// Precedence per OS:
/// - Windows: `%APPDATA%` (AppData\Roaming)
/// - macOS: `$HOME/Library/Application Support`
/// - Linux & Unix: `$XDG_DATA_HOME` falling back to `$HOME/.local/share`
///
/// According to the XDG Base Directory Specification: if `$XDG_DATA_HOME` is either not set, empty,
/// or not an absolute path, it must be ignored, and the default `$HOME/.local/share` must be used instead.
///
/// If native data directories cannot be determined (e.g. required environment variables are missing or empty),
/// this function returns an explicit `Err` rather than falling back to the current directory (`.`).
pub fn resolve_os_data_dir_with_env<F>(target_os: &str, get_env: F) -> std::io::Result<PathBuf>
where
    F: Fn(&str) -> Option<String>,
{
    match target_os {
        "windows" => {
            let app_data = get_env(APPDATA)
                .or_else(|| get_env("AppData"))
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty());

            if let Some(dir) = app_data {
                let p = PathBuf::from(&dir);
                if is_path_absolute_for_os(&p, "windows") {
                    Ok(p)
                } else {
                    Err(std::io::Error::new(
                        std::io::ErrorKind::InvalidInput,
                        format!(
                            "Resolved Windows AppData directory is not an absolute path: '{dir}'"
                        ),
                    ))
                }
            } else {
                Err(std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "Failed to resolve Windows AppData directory: %APPDATA% environment variable is not set or empty",
                ))
            }
        }
        "macos" => {
            let home = get_env("HOME")
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty());

            if let Some(home) = home {
                let p = PathBuf::from(&home);
                if is_path_absolute_for_os(&p, "macos") {
                    Ok(p.join("Library").join("Application Support"))
                } else {
                    Err(std::io::Error::new(
                        std::io::ErrorKind::InvalidInput,
                        format!(
                            "Resolved macOS HOME directory is not an absolute path: '{home}'"
                        ),
                    ))
                }
            } else {
                Err(std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "Failed to resolve macOS Application Support directory: $HOME environment variable is not set or empty",
                ))
            }
        }
        _ => {
            if let Some(xdg) = get_env("XDG_DATA_HOME") {
                let trimmed = xdg.trim();
                let p = Path::new(trimmed);
                if !trimmed.is_empty() && is_path_absolute_for_os(p, target_os) {
                    return Ok(PathBuf::from(trimmed));
                }
            }

            let home = get_env("HOME")
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty());

            if let Some(home) = home {
                let p = PathBuf::from(&home);
                if is_path_absolute_for_os(&p, target_os) {
                    Ok(p.join(".local").join("share"))
                } else {
                    Err(std::io::Error::new(
                        std::io::ErrorKind::InvalidInput,
                        format!(
                            "Resolved Linux/Unix HOME directory is not an absolute path: '{home}'"
                        ),
                    ))
                }
            } else {
                Err(std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "Failed to resolve Linux/Unix data directory: neither $XDG_DATA_HOME is valid absolute path nor $HOME is set",
                ))
            }
        }
    }
}

/// Resolves the current operating system's native base user data directory.
pub fn resolve_system_data_dir() -> std::io::Result<PathBuf> {
    let os = std::env::consts::OS;
    resolve_os_data_dir_with_env(os, |k| std::env::var(k).ok())
}

/// Resolves the default persistent SQLite database path for a specific operating system,
/// reading environment variables via `get_env`.
pub fn resolve_default_db_path_with_env<F>(target_os: &str, get_env: F) -> std::io::Result<PathBuf>
where
    F: Fn(&str) -> Option<String>,
{
    let base_dir = resolve_os_data_dir_with_env(target_os, get_env)?;
    let app_dir = base_dir.join(BUNDLE_IDENTIFIER);
    let db_path = app_dir.join(DEFAULT_DB_NAME);
    if !is_path_absolute_for_os(&db_path, target_os) {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidData,
            "Resolved default database path is not absolute",
        ));
    }
    Ok(db_path)
}

/// Resolves the default persistent SQLite database path for both native CLI and desktop instances.
/// Ensures the enclosing directory is created if not already present, propagating I/O errors.
/// Under no circumstances does this function return a relative path.
pub fn try_get_default_db_path() -> std::io::Result<PathBuf> {
    let base_dir = resolve_system_data_dir()?;
    let app_dir = base_dir.join(BUNDLE_IDENTIFIER);
    std::fs::create_dir_all(&app_dir)?;
    let db_path = app_dir.join(DEFAULT_DB_NAME);
    if !is_path_absolute(&db_path) {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidData,
            "Resolved default database path is not absolute",
        ));
    }
    Ok(db_path)
}

/// Resolves the default persistent SQLite database path.
/// Propagates `std::io::Result<PathBuf>` without any unsafe relative path fallback.
pub fn get_default_db_path() -> std::io::Result<PathBuf> {
    try_get_default_db_path()
}

/// Resolves the default directory for CSV audit sinks.
pub fn get_default_csv_dir(db_path: &Path) -> PathBuf {
    db_path
        .parent()
        .map(|p| p.join("csv"))
        .unwrap_or_else(|| PathBuf::from("./csv"))
}

pub const ENV_OXY_DB_PATH: &str = "OXY_DB_PATH";
pub const ENV_OXYTIME_DB_PATH: &str = "OXYTIME_DB_PATH";

fn ensure_parent_dir_exists(path: &Path) -> std::io::Result<()> {
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent)?;
        }
    }
    Ok(())
}

/// Resolves the SQLite database path based on the precedence hierarchy with custom environment provider:
/// 1. CLI explicit flag `--db <path>`
/// 2. Environment variable `OXY_DB_PATH` or `OXYTIME_DB_PATH`
/// 3. Operating system default user data directory
pub fn resolve_db_path_with_env<F>(
    cli_override: Option<&str>,
    target_os: &str,
    get_env: F,
) -> std::io::Result<PathBuf>
where
    F: Fn(&str) -> Option<String>,
{
    if let Some(path_str) = cli_override {
        let trimmed = path_str.trim();
        if !trimmed.is_empty() {
            let path = PathBuf::from(trimmed);
            ensure_parent_dir_exists(&path)?;
            return Ok(path);
        }
    }

    if let Some(env_path) = get_env(ENV_OXY_DB_PATH).or_else(|| get_env(ENV_OXYTIME_DB_PATH)) {
        let trimmed = env_path.trim();
        if !trimmed.is_empty() {
            let path = PathBuf::from(trimmed);
            ensure_parent_dir_exists(&path)?;
            return Ok(path);
        }
    }

    let default_path = resolve_default_db_path_with_env(target_os, get_env)?;
    ensure_parent_dir_exists(&default_path)?;
    Ok(default_path)
}

/// Resolves the SQLite database path based on the precedence hierarchy:
/// 1. CLI explicit flag `--db <path>`
/// 2. Environment variable `OXY_DB_PATH` or `OXYTIME_DB_PATH`
/// 3. Operating system default user data directory
pub fn resolve_db_path(cli_override: Option<&str>) -> std::io::Result<PathBuf> {
    resolve_db_path_with_env(cli_override, std::env::consts::OS, |k| {
        std::env::var(k).ok()
    })
}
