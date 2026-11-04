use oxy_flow::common::constants::DEFAULT_DB_NAME;
use oxy_flow::common::paths::{
    get_default_csv_dir, get_default_db_path, resolve_default_db_path_with_env,
    resolve_os_data_dir_with_env, try_get_default_db_path,
};
use std::path::Path;

#[test]
fn test_try_get_default_db_path_succeeds_and_creates_dir() {
    // Arrange & Act
    let path_res = try_get_default_db_path();

    // Assert
    assert!(path_res.is_ok(), "try_get_default_db_path should succeed");
    let path = path_res.unwrap();
    assert!(
        path.parent().unwrap().exists(),
        "Enclosing database directory must exist"
    );
    assert_eq!(
        path.parent().unwrap().file_name().unwrap(),
        "com.oxyflow.timelog"
    );
    assert_eq!(
        path.file_name().unwrap(),
        DEFAULT_DB_NAME,
        "Database filename must match DEFAULT_DB_NAME"
    );
}

#[test]
fn test_get_default_db_path_returns_same_as_try_get() {
    // Arrange & Act
    let path = get_default_db_path();

    // Assert
    assert_eq!(path.file_name().unwrap(), DEFAULT_DB_NAME);
    assert_eq!(
        path.parent().unwrap().file_name().unwrap(),
        "com.oxyflow.timelog"
    );
}

#[test]
fn test_get_default_csv_dir_resolves_child_folder() {
    // Arrange
    let db_path = Path::new("C:/test_dir/sub/db.sqlite");

    // Act
    let csv_dir = get_default_csv_dir(db_path);

    // Assert
    assert_eq!(csv_dir, Path::new("C:/test_dir/sub/csv"));
}

#[test]
fn test_resolve_os_data_dir_windows() {
    let dir = resolve_os_data_dir_with_env("windows", |key| {
        if key == "APPDATA" {
            Some("C:\\Users\\User\\AppData\\Roaming".to_string())
        } else {
            None
        }
    })
    .expect("Windows APPDATA should resolve");
    assert_eq!(
        dir,
        std::path::PathBuf::from("C:\\Users\\User\\AppData\\Roaming")
    );
}

#[test]
fn test_resolve_os_data_dir_macos() {
    let dir = resolve_os_data_dir_with_env("macos", |key| {
        if key == "HOME" {
            Some("/Users/User".to_string())
        } else {
            None
        }
    })
    .expect("macOS HOME should resolve");
    assert_eq!(
        dir,
        std::path::PathBuf::from("/Users/User/Library/Application Support")
    );
}

#[test]
fn test_resolve_os_data_dir_linux_xdg() {
    let dir = resolve_os_data_dir_with_env("linux", |key| {
        if key == "XDG_DATA_HOME" {
            Some("/custom/xdg/share".to_string())
        } else {
            None
        }
    })
    .expect("Linux XDG_DATA_HOME should resolve");
    assert_eq!(dir, std::path::PathBuf::from("/custom/xdg/share"));
}

#[test]
fn test_resolve_os_data_dir_linux_fallback() {
    let dir = resolve_os_data_dir_with_env("linux", |key| {
        if key == "HOME" {
            Some("/home/user".to_string())
        } else {
            None
        }
    })
    .expect("Linux HOME fallback should resolve");
    assert_eq!(dir, std::path::PathBuf::from("/home/user/.local/share"));
}

#[test]
fn test_resolve_linux_xdg_relative_path_rejected_and_falls_back_to_home() {
    let db_path = resolve_default_db_path_with_env("linux", |key| match key {
        "XDG_DATA_HOME" => Some("relative/data".to_string()),
        "HOME" => Some("/home/user".to_string()),
        _ => None,
    })
    .expect("Relative XDG_DATA_HOME must be ignored and fallback to HOME");

    assert_eq!(
        db_path,
        std::path::PathBuf::from("/home/user/.local/share/com.oxyflow.timelog/oxytime.db")
    );
}

#[test]
fn test_resolve_os_data_dir_missing_env_returns_error_without_current_dir_fallback() {
    for os in &["windows", "macos", "linux"] {
        let res = resolve_os_data_dir_with_env(os, |_| None);
        assert!(
            res.is_err(),
            "Resolver for {os} must return Err when environment variables are missing"
        );
        let err = res.unwrap_err();
        assert_eq!(err.kind(), std::io::ErrorKind::NotFound);

        let db_res = resolve_default_db_path_with_env(os, |_| None);
        assert!(
            db_res.is_err(),
            "Default DB path resolver for {os} must return Err when environment variables are missing"
        );
    }
}
