use oxy_flow::app::guard::{
    is_authorized_origin, resolve_authorized_dev_origin, validate_or_fallback_url, DEFAULT_DEV_URL,
};
use std::fs::{create_dir_all, remove_dir_all, File};
use std::io::Write;

#[test]
fn test_resolve_authorized_dev_origin_falls_back_when_file_missing() {
    // Arrange
    let dir = std::env::temp_dir().join(format!("guard_test_{}", uuid::Uuid::new_v4()));
    create_dir_all(&dir).unwrap();
    let non_existent_config = dir.join("dev.config.json");

    // Act
    let origin = resolve_authorized_dev_origin(Some(&non_existent_config));

    // Assert
    assert_eq!(origin, DEFAULT_DEV_URL);

    let _ = remove_dir_all(dir);
}

#[test]
fn test_resolve_authorized_dev_origin_reads_valid_config() {
    // Arrange
    let dir = std::env::temp_dir().join(format!("guard_test_{}", uuid::Uuid::new_v4()));
    create_dir_all(&dir).unwrap();
    let config_path = dir.join("dev.config.json");
    let mut file = File::create(&config_path).unwrap();
    writeln!(
        file,
        r#"{{"protocol": "http", "host": "127.0.0.1", "port": 3008}}"#
    )
    .unwrap();

    // Act
    let origin = resolve_authorized_dev_origin(Some(&config_path));

    // Assert
    assert_eq!(origin, "http://127.0.0.1:3008/");

    let _ = remove_dir_all(dir);
}

#[test]
fn test_is_authorized_origin_allows_tauri_scheme() {
    // Arrange
    let target = "tauri://localhost/index.html";
    let dev_origin = "http://127.0.0.1:3000/";

    // Act
    let allowed = is_authorized_origin(target, dev_origin);

    // Assert
    assert!(allowed);
}

#[test]
fn test_is_authorized_origin_evaluates_dev_origin_match() {
    // Arrange
    let matching_url = "http://127.0.0.1:3000/settings";
    let dev_origin = "http://127.0.0.1:3000/";

    // Act
    let allowed = is_authorized_origin(matching_url, dev_origin);

    // Assert
    assert!(allowed);
}

#[test]
fn test_is_authorized_origin_rejects_unauthorized_external_host() {
    // Arrange
    let rogue_url = "http://malicious-external-site.com/steal";
    let dev_origin = "http://127.0.0.1:3000/";

    // Act
    let allowed = is_authorized_origin(rogue_url, dev_origin);

    // Assert
    assert!(!allowed);
}

#[test]
fn test_validate_or_fallback_url_returns_target_when_valid() {
    // Arrange
    let valid_url = "tauri://localhost";
    let fallback = DEFAULT_DEV_URL;

    // Act
    let result = validate_or_fallback_url(valid_url, fallback);

    // Assert
    assert_eq!(result, valid_url);
}

#[test]
fn test_validate_or_fallback_url_replaces_unauthorized_url() {
    // Arrange
    let invalid_url = "http://unauthorized.domain.org";
    let fallback = DEFAULT_DEV_URL;

    // Act
    let result = validate_or_fallback_url(invalid_url, fallback);

    // Assert
    assert_eq!(result, fallback);
}
