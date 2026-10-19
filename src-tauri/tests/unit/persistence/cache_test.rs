use crate::shared::builders::ProjectBuilder;
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::persistence::Persistence;

#[test]
fn test_persistence_cache_serves_cached_project_after_direct_db_update() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("persistence_cache_hit");
    let persistence = Persistence::new(&config).unwrap();

    let project = ProjectBuilder::new()
        .with_id("p-cache-1")
        .with_name("CachedProject")
        .with_color("blue")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    persistence.projects.create(project).unwrap();

    // Populate the cache by reading
    let _ = persistence.projects.get("p-cache-1").unwrap();

    // Update database directly behind the cache's back
    conn.execute(
        "UPDATE projects SET name = ?1 WHERE id = ?2",
        ["DirectDbUpdate", "p-cache-1"],
    )
    .unwrap();

    // Act
    let p_fetched = persistence.projects.get("p-cache-1").unwrap().unwrap();

    // Assert
    assert_eq!(p_fetched.name, "CachedProject");
}

#[test]
fn test_persistence_cache_invalidation_on_write_refreshes_stale_entries() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("persistence_cache_inv");
    let persistence = Persistence::new(&config).unwrap();

    let project = ProjectBuilder::new()
        .with_id("p-cache-1")
        .with_name("CachedProject")
        .with_color("blue")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    persistence.projects.create(project).unwrap();

    // Populate the cache
    let _ = persistence.projects.get("p-cache-1").unwrap();

    // Update directly in DB
    conn.execute(
        "UPDATE projects SET name = ?1 WHERE id = ?2",
        ["DirectDbUpdate", "p-cache-1"],
    )
    .unwrap();

    // Act
    // Writing through the repository invalidates the project cache
    let dummy_project = ProjectBuilder::new()
        .with_id("p-dummy")
        .with_name("Dummy")
        .with_color("red")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    persistence.projects.create(dummy_project).unwrap();

    // Assert
    let p_fetched = persistence.projects.get("p-cache-1").unwrap().unwrap();
    assert_eq!(p_fetched.name, "DirectDbUpdate");
}
