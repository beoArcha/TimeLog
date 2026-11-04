use oxyflow_timelog::common::constants::DEFAULT_DB_NAME;
use oxyflow_timelog::common::paths::{
    get_default_csv_dir, get_default_db_path, try_get_default_db_path,
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
    let dir = oxyflow_timelog::common::paths::resolve_os_data_dir_with_env("windows", |key| {
        if key == "APPDATA" {
            Some("C:\\Users\\User\\AppData\\Roaming".to_string())
        } else {
            None
        }
    });
    assert_eq!(
        dir,
        std::path::PathBuf::from("C:\\Users\\User\\AppData\\Roaming")
    );
}

#[test]
fn test_resolve_os_data_dir_macos() {
    let dir = oxyflow_timelog::common::paths::resolve_os_data_dir_with_env("macos", |key| {
        if key == "HOME" {
            Some("/Users/User".to_string())
        } else {
            None
        }
    });
    assert_eq!(
        dir,
        std::path::PathBuf::from("/Users/User/Library/Application Support")
    );
}

#[test]
fn test_resolve_os_data_dir_linux_xdg() {
    let dir = oxyflow_timelog::common::paths::resolve_os_data_dir_with_env("linux", |key| {
        if key == "XDG_DATA_HOME" {
            Some("/custom/xdg/share".to_string())
        } else {
            None
        }
    });
    assert_eq!(dir, std::path::PathBuf::from("/custom/xdg/share"));
}

#[test]
fn test_resolve_os_data_dir_linux_fallback() {
    let dir = oxyflow_timelog::common::paths::resolve_os_data_dir_with_env("linux", |key| {
        if key == "HOME" {
            Some("/home/user".to_string())
        } else {
            None
        }
    });
    assert_eq!(dir, std::path::PathBuf::from("/home/user/.local/share"));
}
