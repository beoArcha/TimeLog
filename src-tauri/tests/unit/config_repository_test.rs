use oxy_flow::repositories::config::ConfigRepository;
use oxy_flow::types::Settings;
use rusqlite::params;

#[test]
fn test_config_repository_self_healing_missing_keys() {
    let db_path = std::env::temp_dir().join("test_config_missing.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }

    let repo = ConfigRepository::new(&db_path).unwrap();

    let config = repo
        .get_config()
        .expect("get_config should succeed and self-heal");

    let defaults = Settings::default();
    assert_eq!(config.auto_start, defaults.auto_start);
    assert_eq!(config.auto_pause_on_sleep, defaults.auto_pause_on_sleep);
    assert_eq!(
        config.include_patches_in_reports,
        defaults.include_patches_in_reports
    );

    let config2 = repo.get_config().expect("second get_config should succeed");
    assert_eq!(config2.auto_start, defaults.auto_start);

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_config_repository_retains_valid_keys() {
    let db_path = std::env::temp_dir().join("test_config_retains.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }

    let repo = ConfigRepository::new(&db_path).unwrap();

    {
        let conn = rusqlite::Connection::open(&db_path).unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO config (key, value) VALUES (?1, ?2)",
            params!["auto_start", "true"],
        )
        .unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO config (key, value) VALUES (?1, ?2)",
            params!["auto_pause_on_sleep", "false"],
        )
        .unwrap();
    }

    let config = repo
        .get_config()
        .expect("get_config should self-heal missing key");
    assert_eq!(config.auto_start, true);
    assert_eq!(config.auto_pause_on_sleep, false);
    assert_eq!(
        config.include_patches_in_reports,
        Settings::default().include_patches_in_reports
    );

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_config_repository_self_healing_corrupted_keys() {
    let db_path = std::env::temp_dir().join("test_config_corrupted.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }

    let repo = ConfigRepository::new(&db_path).unwrap();

    {
        let conn = rusqlite::Connection::open(&db_path).unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO config (key, value) VALUES (?1, ?2)",
            params!["auto_start", "not-a-boolean"],
        )
        .unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO config (key, value) VALUES (?1, ?2)",
            params!["auto_pause_on_sleep", "false"],
        )
        .unwrap();
    }

    let config = repo
        .get_config()
        .expect("get_config should self-heal corrupted key");
    assert_eq!(config.auto_start, false);
    assert_eq!(config.auto_pause_on_sleep, false);

    let _ = std::fs::remove_file(&db_path);
}
