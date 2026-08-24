use crate::shared::test_db::setup_persistence_test;
use oxy_flow::repositories::config::ConfigRepository;
use oxy_flow::types::RuntimeConfig;

#[test]
fn test_runtime_config_save_and_get() {
    let (_conn, config, _temp_dir) = setup_persistence_test("runtime_config_test");
    let repo = ConfigRepository::new(&config.db_path).unwrap();
    let configs_initial = repo.get_runtime_configs().unwrap();

    assert_eq!(configs_initial.len(), 0);

    let rc1 = RuntimeConfig {
        id: "rc_1".to_string(),
        runtime: "electron".to_string(),
        config: "{\"theme\":\"dark\"}".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
    };
    repo.save_runtime_config(&rc1).unwrap();

    let rc2 = RuntimeConfig {
        id: "rc_2".to_string(),
        runtime: "tauri".to_string(),
        config: "{\"theme\":\"light\"}".to_string(),
        created_at: "2025-01-02T00:00:00Z".to_string(),
    };
    repo.save_runtime_config(&rc2).unwrap();

    let configs = repo.get_runtime_configs().unwrap();
    assert_eq!(configs.len(), 2);
    assert!(configs
        .iter()
        .any(|c| c.id == "rc_1" && c.runtime == "electron"));
    assert!(configs
        .iter()
        .any(|c| c.id == "rc_2" && c.runtime == "tauri"));
}
