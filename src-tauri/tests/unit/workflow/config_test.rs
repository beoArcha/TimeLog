use oxy_flow::repositories::config::ConfigRepository;
use oxy_flow::types::{
    WorkflowConfig, DEFAULT_AUTO_STOP_DAILY_BOUNDARY_TIME, DEFAULT_AUTO_STOP_HOURS_LIMIT,
};
use std::path::PathBuf;

fn setup_test_config_repo(test_name: &str) -> (ConfigRepository, PathBuf) {
    let db_path = std::env::temp_dir().join(format!("{}.db", test_name));
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = ConfigRepository::new(&db_path).unwrap();
    (repo, db_path)
}

#[test]
fn test_workflow_config_repository_returns_defaults_when_missing() {
    // Arrange
    let (repo, db_path) = setup_test_config_repo("test_workflow_cfg_defaults");

    // Act
    let default_cfg = repo.get_workflow_config().unwrap();

    // Assert
    assert!(!default_cfg.auto_stop_hours_limit_enabled);
    assert_eq!(
        default_cfg.auto_stop_hours_limit,
        DEFAULT_AUTO_STOP_HOURS_LIMIT
    );
    assert_eq!(
        default_cfg.auto_stop_daily_boundary_time,
        DEFAULT_AUTO_STOP_DAILY_BOUNDARY_TIME
    );

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_workflow_config_repository_saves_and_retrieves_custom_config() {
    // Arrange
    let (repo, db_path) = setup_test_config_repo("test_workflow_cfg_custom");
    let custom_cfg = WorkflowConfig {
        auto_stop_hours_limit_enabled: true,
        auto_stop_hours_limit: 6.5,
        auto_stop_daily_boundary_enabled: true,
        auto_stop_daily_boundary_time: "18:30".to_string(),
        auto_stop_on_task_complete: true,
        warning_notification_enabled: false,
    };

    // Act
    repo.save_workflow_config(&custom_cfg).unwrap();
    let loaded_cfg = repo.get_workflow_config().unwrap();

    // Assert
    assert_eq!(custom_cfg, loaded_cfg);

    let _ = std::fs::remove_file(&db_path);
}
