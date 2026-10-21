use oxy_flow::repositories::config::ConfigRepository;
use oxy_flow::types::ExternalApiSettings;

#[test]
fn test_auxiliary_repository_current_project_id_roundtrip() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_aux_proj_id.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = ConfigRepository::new(&db_path).unwrap();

    // Act
    let initial = repo.get_current_project_id().unwrap();
    repo.save_current_project_id(Some("p_active")).unwrap();
    let updated = repo.get_current_project_id().unwrap();
    repo.save_current_project_id(None).unwrap();
    let cleared = repo.get_current_project_id().unwrap();

    // Assert
    assert_eq!(initial, None);
    assert_eq!(updated, Some("p_active".to_string()));
    assert_eq!(cleared, None);

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_auxiliary_repository_last_non_compact_variant_roundtrip() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_aux_variant.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = ConfigRepository::new(&db_path).unwrap();

    // Act
    let default_variant = repo.get_last_non_compact_variant().unwrap();
    repo.save_last_non_compact_variant("mini").unwrap();
    let updated_variant = repo.get_last_non_compact_variant().unwrap();

    // Assert
    assert_eq!(default_variant, "full");
    assert_eq!(updated_variant, "mini");

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_auxiliary_repository_external_api_settings_defaults_and_roundtrip() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_aux_api.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = ConfigRepository::new(&db_path).unwrap();

    let custom_api = ExternalApiSettings {
        log_to_api: true,
        api_token: "secret_token_123".to_string(),
        api_url: "https://api.example.com/log".to_string(),
        api_method: "PUT".to_string(),
        api_headers: "Authorization: Bearer test".to_string(),
    };

    // Act
    let default_api = repo.get_external_api_settings().unwrap();
    repo.save_external_api_settings(&custom_api).unwrap();
    let saved_api = repo.get_external_api_settings().unwrap();

    // Assert
    assert!(!default_api.log_to_api);
    assert_eq!(default_api.api_method, "POST");
    assert_eq!(default_api.api_token, "");
    assert_eq!(default_api.api_url, "");
    assert_eq!(default_api.api_headers, "");
    assert_eq!(saved_api, custom_api);

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_auxiliary_repository_locale_settings_defaults_and_roundtrip() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_aux_locale.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = ConfigRepository::new(&db_path).unwrap();

    let translations_json = "{\"pl\":{\"greeting\":\"Cześć\"}}";

    // Act
    let default_pref = repo.get_locale_pref().unwrap();
    let default_loc = repo.get_locale().unwrap();
    let default_trans = repo.get_custom_translations().unwrap();

    repo.save_locale_pref("pl").unwrap();
    repo.save_locale("pl-PL").unwrap();
    repo.save_custom_translations(translations_json).unwrap();

    let saved_pref = repo.get_locale_pref().unwrap();
    let saved_loc = repo.get_locale().unwrap();
    let saved_trans = repo.get_custom_translations().unwrap();

    // Assert
    assert_eq!(default_pref, "system");
    assert_eq!(default_loc, "system");
    assert_eq!(default_trans, "{}");
    assert_eq!(saved_pref, "pl");
    assert_eq!(saved_loc, "pl-PL");
    assert_eq!(saved_trans, translations_json);

    let _ = std::fs::remove_file(&db_path);
}
