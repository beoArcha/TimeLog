use oxy_flow::repositories::config::ConfigRepository;
use oxy_flow::types::ExternalApiSettings;

#[test]
fn test_auxiliary_repository_ui_state() {
    let db_path = std::env::temp_dir().join("test_aux_ui_state.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }

    let repo = ConfigRepository::new(&db_path).unwrap();

    // Default current project is None
    assert_eq!(repo.get_current_project_id().unwrap(), None);

    // Save and retrieve project id
    repo.save_current_project_id(Some("p_active")).unwrap();
    assert_eq!(
        repo.get_current_project_id().unwrap(),
        Some("p_active".to_string())
    );

    // Clear project id by passing None
    repo.save_current_project_id(None).unwrap();
    assert_eq!(repo.get_current_project_id().unwrap(), None);

    // Default variant is "full"
    assert_eq!(repo.get_last_non_compact_variant().unwrap(), "full");

    // Save and retrieve variant
    repo.save_last_non_compact_variant("mini").unwrap();
    assert_eq!(repo.get_last_non_compact_variant().unwrap(), "mini");

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_auxiliary_repository_external_api_and_locale() {
    let db_path = std::env::temp_dir().join("test_aux_api_locale.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }

    let repo = ConfigRepository::new(&db_path).unwrap();

    // Default external API settings
    let default_api = repo.get_external_api_settings().unwrap();
    assert!(!default_api.log_to_api);
    assert_eq!(default_api.api_method, "POST");
    assert_eq!(default_api.api_token, "");
    assert_eq!(default_api.api_url, "");
    assert_eq!(default_api.api_headers, "");

    // Save and retrieve external API settings
    let custom_api = ExternalApiSettings {
        log_to_api: true,
        api_token: "secret_token_123".to_string(),
        api_url: "https://api.example.com/log".to_string(),
        api_method: "PUT".to_string(),
        api_headers: "Authorization: Bearer test".to_string(),
    };
    repo.save_external_api_settings(&custom_api).unwrap();

    let saved_api = repo.get_external_api_settings().unwrap();
    assert_eq!(saved_api, custom_api);

    // Defaults for locale
    assert_eq!(repo.get_locale_pref().unwrap(), "system");
    assert_eq!(repo.get_locale().unwrap(), "system");
    assert_eq!(repo.get_custom_translations().unwrap(), "{}");

    // Save and retrieve locale settings
    repo.save_locale_pref("pl").unwrap();
    assert_eq!(repo.get_locale_pref().unwrap(), "pl");

    repo.save_locale("pl-PL").unwrap();
    assert_eq!(repo.get_locale().unwrap(), "pl-PL");

    let translations_json = "{\"pl\":{\"greeting\":\"Cześć\"}}";
    repo.save_custom_translations(translations_json).unwrap();
    assert_eq!(repo.get_custom_translations().unwrap(), translations_json);

    let _ = std::fs::remove_file(&db_path);
}
