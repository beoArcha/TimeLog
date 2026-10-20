use oxy_flow::repositories::config::ConfigRepository;
use oxy_flow::types::{CliAlias, CliSink};

#[test]
fn test_cli_aliases_crud_operations() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_cli_aliases.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = ConfigRepository::new(&db_path).unwrap();

    let alias = CliAlias {
        name: "standup".to_string(),
        template: "log add meetings 15m \"Daily standup\"".to_string(),
        created_at: "2026-10-20T10:00:00Z".to_string(),
    };

    // Act
    repo.save_cli_alias(&alias).unwrap();
    let retrieved = repo.get_cli_alias("standup").unwrap();
    let all = repo.get_all_cli_aliases().unwrap();
    let deleted = repo.delete_cli_alias("standup").unwrap();
    let non_existent = repo.get_cli_alias("standup").unwrap();

    // Assert
    assert_eq!(retrieved, Some(alias));
    assert_eq!(all.len(), 1);
    assert!(deleted);
    assert_eq!(non_existent, None);

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_cli_sinks_crud_operations() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_cli_sinks.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = ConfigRepository::new(&db_path).unwrap();

    let sink = CliSink {
        name: "webhook".to_string(),
        sink_type: "webhook".to_string(),
        target: "https://api.example.com/events".to_string(),
        config: Some("{\"token\":\"secret\"}".to_string()),
        enabled: true,
        created_at: "2026-10-20T10:00:00Z".to_string(),
    };

    // Act
    repo.save_cli_sink(&sink).unwrap();
    let retrieved = repo.get_cli_sink("webhook").unwrap();
    let all = repo.get_all_cli_sinks().unwrap();
    let deleted = repo.delete_cli_sink("webhook").unwrap();
    let non_existent = repo.get_cli_sink("webhook").unwrap();

    // Assert
    assert_eq!(retrieved, Some(sink));
    assert_eq!(all.len(), 1);
    assert!(deleted);
    assert_eq!(non_existent, None);

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_cli_config_entries_key_value_operations() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_cli_config_entries.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = ConfigRepository::new(&db_path).unwrap();

    // Act
    repo.set_config_value("editor_theme", "dracula").unwrap();
    let val = repo.get_config_value("editor_theme").unwrap();
    let entries = repo.get_all_config_entries().unwrap();

    // Assert
    assert_eq!(val, Some("dracula".to_string()));
    assert!(entries
        .iter()
        .any(|(k, v)| k == "editor_theme" && v == "dracula"));

    let _ = std::fs::remove_file(&db_path);
}
