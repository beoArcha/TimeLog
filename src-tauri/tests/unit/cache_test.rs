use crate::shared::test_db::setup_persistence_test;
use oxy_flow::persistence::PersistenceLayer;
use oxy_flow::types::Project;

#[test]
fn test_persistence_cache_hit_and_invalidation() {
    let (conn, config, _temp_dir) = setup_persistence_test("persistence_cache");
    let persistence = PersistenceLayer::new(&config).unwrap();

    let project = Project {
        id: "p-cache-1".to_string(),
        name: "CachedProject".to_string(),
        color: "blue".to_string(),
        created_at: "2026-06-22T20:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
    };

    persistence.create_project(project).unwrap();

    let p_fetched1 = persistence.get_project("p-cache-1").unwrap().unwrap();
    assert_eq!(p_fetched1.name, "CachedProject");

    conn.execute(
        "UPDATE projects SET name = ?1 WHERE id = ?2",
        ["DirectDbUpdate", "p-cache-1"],
    )
    .unwrap();

    let p_fetched2 = persistence.get_project("p-cache-1").unwrap().unwrap();
    assert_eq!(p_fetched2.name, "CachedProject");

    let dummy_project = Project {
        id: "p-dummy".to_string(),
        name: "Dummy".to_string(),
        color: "red".to_string(),
        created_at: "2026-06-22T20:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
    };
    persistence.create_project(dummy_project).unwrap();

    let p_fetched3 = persistence.get_project("p-cache-1").unwrap().unwrap();
    assert_eq!(p_fetched3.name, "DirectDbUpdate");
}
