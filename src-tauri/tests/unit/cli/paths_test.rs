use oxy_flow::common::constants::DEFAULT_DB_NAME;
use oxy_flow::common::paths::{resolve_db_path, ENV_OXY_DB_PATH};
#[test]
fn test_given_cli_override_flag_when_resolving_db_path_then_prioritizes_cli_path() {
    // Arrange
    let custom_db = std::env::temp_dir().join("oxy_test_sub").join("custom.db");
    let custom_str = custom_db.to_str().expect("Path to str");

    // Act
    let resolved = resolve_db_path(Some(custom_str)).expect("Resolve path");

    // Assert
    assert_eq!(resolved, custom_db);
    assert!(custom_db.parent().expect("Parent exists").exists());
    let _ = std::fs::remove_dir_all(custom_db.parent().expect("Parent"));
}

#[test]
fn test_given_env_var_and_no_cli_flag_when_resolving_db_path_then_uses_env_var() {
    // Arrange
    let env_db = std::env::temp_dir().join("oxy_from_env.db");
    let env_str = env_db.to_str().expect("Path to str");
    std::env::set_var(ENV_OXY_DB_PATH, env_str);

    // Act
    let resolved = resolve_db_path(None).expect("Resolve path");

    // Assert
    std::env::remove_var(ENV_OXY_DB_PATH);
    assert_eq!(resolved, env_db);
}

#[test]
fn test_given_no_flag_and_no_env_when_resolving_db_path_then_falls_back_to_default() {
    // Arrange
    std::env::remove_var(ENV_OXY_DB_PATH);

    // Act
    let resolved = resolve_db_path(None).expect("Resolve path");

    // Assert
    assert!(resolved.ends_with(DEFAULT_DB_NAME));
}
