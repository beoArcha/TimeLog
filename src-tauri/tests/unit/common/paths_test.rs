use oxy_flow::common::constants::{BUNDLE_IDENTIFIER, DEFAULT_DB_NAME};
use oxy_flow::common::paths::{
    get_default_csv_dir, get_default_db_path, is_path_absolute, is_path_absolute_for_os,
    resolve_db_path_with_env, resolve_default_db_path_with_env, resolve_os_data_dir_with_env,
    try_get_default_db_path, ENV_OXYTIME_DB_PATH, ENV_OXY_DB_PATH,
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
        path.is_absolute(),
        "try_get_default_db_path must return an absolute path"
    );
    assert!(
        path.parent().unwrap().exists(),
        "Enclosing database directory must exist"
    );
    assert_eq!(
        path.parent().unwrap().file_name().unwrap(),
        BUNDLE_IDENTIFIER
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
    let path_res = get_default_db_path();
    assert!(path_res.is_ok(), "get_default_db_path should succeed");
    let path = path_res.unwrap();
    let try_path = try_get_default_db_path().expect("try_get_default_db_path should succeed");

    // Assert
    assert_eq!(path, try_path);
    assert!(
        path.is_absolute(),
        "get_default_db_path must return an absolute path"
    );
    assert_eq!(path.file_name().unwrap(), DEFAULT_DB_NAME);
    assert_eq!(
        path.parent().unwrap().file_name().unwrap(),
        BUNDLE_IDENTIFIER
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
    assert!(is_path_absolute_for_os(&dir, "windows"));
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
    assert!(is_path_absolute_for_os(&dir, "macos"));
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
    assert!(is_path_absolute_for_os(&dir, "linux"));
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
    assert!(is_path_absolute_for_os(&dir, "linux"));
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
        std::path::PathBuf::from(format!(
            "/home/user/.local/share/{}/{}",
            BUNDLE_IDENTIFIER, DEFAULT_DB_NAME
        ))
    );
    assert!(is_path_absolute_for_os(&db_path, "linux"));
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

#[test]
fn test_resolve_os_data_dir_relative_paths_rejected_with_invalid_input() {
    // Windows APPDATA set to relative path must return Err(InvalidInput)
    let win_res = resolve_os_data_dir_with_env("windows", |_| Some("relative/appdata".to_string()));
    assert!(win_res.is_err());
    assert_eq!(
        win_res.unwrap_err().kind(),
        std::io::ErrorKind::InvalidInput
    );

    // macOS HOME set to relative path must return Err(InvalidInput)
    let mac_res = resolve_os_data_dir_with_env("macos", |_| Some("relative/home".to_string()));
    assert!(mac_res.is_err());
    assert_eq!(
        mac_res.unwrap_err().kind(),
        std::io::ErrorKind::InvalidInput
    );

    // Linux with relative HOME and no XDG must return Err(InvalidInput)
    let linux_res = resolve_os_data_dir_with_env("linux", |k| match k {
        "HOME" => Some("relative/home".to_string()),
        _ => None,
    });
    assert!(linux_res.is_err());
    assert_eq!(
        linux_res.unwrap_err().kind(),
        std::io::ErrorKind::InvalidInput
    );
}

#[test]
fn test_resolve_db_path_preserves_cli_flag_and_env_vars() {
    let tmp = std::env::temp_dir();
    let cli_override = tmp.join("cli_override.db");
    let env_oxy = tmp.join("env_oxy.db");
    let env_oxytime = tmp.join("env_oxytime.db");

    let cli_str = cli_override.to_str().unwrap();
    let env_oxy_str = env_oxy.to_str().unwrap().to_string();
    let env_oxytime_str = env_oxytime.to_str().unwrap().to_string();

    // 1. CLI flag takes precedence over both env vars
    let res = resolve_db_path_with_env(Some(cli_str), "linux", |k| match k {
        ENV_OXY_DB_PATH => Some(env_oxy_str.clone()),
        ENV_OXYTIME_DB_PATH => Some(env_oxytime_str.clone()),
        _ => None,
    })
    .expect("CLI override should resolve");
    assert_eq!(res, cli_override);

    // 2. OXY_DB_PATH takes precedence over OXYTIME_DB_PATH
    let res = resolve_db_path_with_env(None, "linux", |k| match k {
        ENV_OXY_DB_PATH => Some(env_oxy_str.clone()),
        ENV_OXYTIME_DB_PATH => Some(env_oxytime_str.clone()),
        _ => None,
    })
    .expect("OXY_DB_PATH should resolve");
    assert_eq!(res, env_oxy);

    // 3. OXYTIME_DB_PATH is used when OXY_DB_PATH is not set
    let res = resolve_db_path_with_env(None, "linux", |k| match k {
        ENV_OXYTIME_DB_PATH => Some(env_oxytime_str.clone()),
        _ => None,
    })
    .expect("OXYTIME_DB_PATH should resolve");
    assert_eq!(res, env_oxytime);

    // 4. Default path when neither CLI nor env vars are set.
    // Use a writable temporary data directory for the host OS because resolve_db_path_with_env
    // creates the parent directory for the resolved database path.
    let test_home = tmp.join(format!("timelog-resolver-home-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&test_home);
    std::fs::create_dir_all(&test_home).expect("Temporary HOME should be writable");
    let home_str = test_home
        .to_str()
        .expect("Temporary HOME should be valid UTF-8");

    let host_os = std::env::consts::OS;
    let (env_key, expected_data_dir) = if host_os == "windows" {
        ("APPDATA", test_home.clone())
    } else if host_os == "macos" {
        (
            "HOME",
            test_home.join("Library").join("Application Support"),
        )
    } else {
        ("HOME", test_home.join(".local").join("share"))
    };

    let res = resolve_db_path_with_env(None, host_os, |k| {
        if k == env_key {
            Some(home_str.to_string())
        } else {
            None
        }
    })
    .expect("Default host OS path should resolve");
    assert_eq!(
        res,
        expected_data_dir
            .join(BUNDLE_IDENTIFIER)
            .join(DEFAULT_DB_NAME)
    );
    assert!(
        res.parent().expect("Database parent should exist").is_dir(),
        "Resolver should create the default database directory"
    );
    std::fs::remove_dir_all(&test_home).expect("Temporary HOME should be removable");

    // 5. When env vars are missing and OS defaults cannot be resolved, an explicit Err is returned
    let res = resolve_db_path_with_env(None, "linux", |_| None);
    assert!(
        res.is_err(),
        "Must return Err when data dir cannot be determined"
    );
}

#[test]
fn test_resolve_db_path_env_fallback_matrix() {
    let tmp = std::env::temp_dir();
    let oxy_db = tmp.join("oxy_custom.db");
    let oxytime_db = tmp.join("oxytime_custom.db");
    let oxy_str = oxy_db.to_str().unwrap().to_string();
    let oxytime_str = oxytime_db.to_str().unwrap().to_string();

    let host_os = std::env::consts::OS;
    let (env_key, default_base) = if host_os == "windows" {
        ("APPDATA", tmp.clone())
    } else if host_os == "macos" {
        ("HOME", tmp.join("Library").join("Application Support"))
    } else {
        ("HOME", tmp.join(".local").join("share"))
    };
    let default_db = default_base.join(BUNDLE_IDENTIFIER).join(DEFAULT_DB_NAME);
    let tmp_str = tmp.to_str().unwrap().to_string();

    let cases = vec![
        (
            Some(oxy_str.clone()),
            Some(oxytime_str.clone()),
            true,
            false,
        ), // valid path, valid path -> OXY_DB_PATH
        (Some("".to_string()), Some(oxytime_str.clone()), false, true), // empty, valid path -> OXYTIME_DB_PATH
        (
            Some("   ".to_string()),
            Some(oxytime_str.clone()),
            false,
            true,
        ), // whitespace, valid path -> OXYTIME_DB_PATH
        (None, Some(oxytime_str.clone()), false, true), // missing, valid path -> OXYTIME_DB_PATH
        (Some(oxy_str), Some("".to_string()), true, false), // valid path, empty -> OXY_DB_PATH
        (Some("".to_string()), Some("".to_string()), false, false), // empty, empty -> default path
        (None, None, false, false),                     // missing, missing -> default path
    ];

    for (oxy_val, oxytime_val, expect_oxy, expect_oxytime) in cases {
        let res = resolve_db_path_with_env(None, host_os, |k| {
            if k == ENV_OXY_DB_PATH {
                oxy_val.clone()
            } else if k == ENV_OXYTIME_DB_PATH {
                oxytime_val.clone()
            } else if k == env_key {
                Some(tmp_str.clone())
            } else {
                None
            }
        })
        .expect("Database path should resolve");

        if expect_oxy {
            assert_eq!(res, oxy_db, "Should use OXY_DB_PATH");
        } else if expect_oxytime {
            assert_eq!(res, oxytime_db, "Should use OXYTIME_DB_PATH");
        } else {
            assert_eq!(res, default_db, "Should fallback to default database path");
        }
    }
}

#[test]
fn test_resolve_os_data_dir_rejects_backslash_relative_paths_on_unix() {
    let windows_result = resolve_os_data_dir_with_env("windows", |key| {
        if key == "APPDATA" {
            Some("\\relative\\appdata".to_string())
        } else {
            None
        }
    });
    assert_eq!(
        windows_result.unwrap_err().kind(),
        std::io::ErrorKind::InvalidInput
    );

    let linux_dir = resolve_os_data_dir_with_env("linux", |key| match key {
        "XDG_DATA_HOME" => Some("\\relative\\data".to_string()),
        "HOME" => Some("/home/user".to_string()),
        _ => None,
    })
    .expect("Backslash-relative XDG_DATA_HOME must be ignored");

    assert_eq!(linux_dir, Path::new("/home/user/.local/share"));
}

#[test]
fn test_is_path_absolute_uses_target_os_semantics() {
    // Unix paths are absolute only when rooted with '/'.
    assert!(is_path_absolute_for_os(
        Path::new("/home/user/file"),
        "linux"
    ));
    assert!(is_path_absolute_for_os(
        Path::new("/Users/user/data"),
        "macos"
    ));
    assert!(!is_path_absolute_for_os(
        Path::new("\\relative\\data"),
        "linux"
    ));
    assert!(!is_path_absolute_for_os(
        Path::new("\\relative\\data"),
        "macos"
    ));
    assert!(!is_path_absolute_for_os(
        Path::new("relative/path"),
        "linux"
    ));

    // Windows requires a drive root or a complete UNC server/share path.
    assert!(is_path_absolute_for_os(
        Path::new("C:\\Users\\User"),
        "windows"
    ));
    assert!(is_path_absolute_for_os(
        Path::new("C:/Users/User"),
        "windows"
    ));
    assert!(is_path_absolute_for_os(
        Path::new("\\\\server\\share"),
        "windows"
    ));
    assert!(is_path_absolute_for_os(
        Path::new("//server/share"),
        "windows"
    ));
    assert!(!is_path_absolute_for_os(
        Path::new("relative\\data"),
        "windows"
    ));
    assert!(!is_path_absolute_for_os(Path::new("\\relative"), "windows"));
    assert!(!is_path_absolute_for_os(Path::new("C:relative"), "windows"));
    assert!(!is_path_absolute_for_os(Path::new("\\\\server"), "windows"));

    assert_eq!(is_path_absolute(Path::new("/home/user/file")), cfg!(unix));
}
