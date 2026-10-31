use oxy_flow::repositories::shared::{establish_connection, initialize_database};
use rusqlite::Connection;

#[test]
fn test_given_new_database_file_when_initializing_then_applies_all_migrations_and_records_versions()
{
    // Given
    let db_path = std::env::temp_dir().join(format!(
        "test_migration_{}.db",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let conn = establish_connection(&db_path).expect("connection should be established");

    // When
    let result = initialize_database(&conn);

    // Then
    assert!(
        result.is_ok(),
        "initialize_database should succeed on fresh database"
    );

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM schema_migrations", [], |r| r.get(0))
        .expect("querying schema_migrations should succeed");
    assert_eq!(count, 7, "all 7 migration steps must be recorded");

    let projects_exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='projects'",
            [],
            |r| r.get::<_, i64>(0),
        )
        .map(|c| c > 0)
        .expect("sqlite_master query should succeed");
    assert!(projects_exists, "projects table must exist");

    drop(conn);
    let _ = std::fs::remove_file(db_path);
}

#[test]
fn test_given_already_migrated_database_when_initializing_again_then_is_idempotent_without_errors()
{
    // Given
    let db_path = std::env::temp_dir().join(format!(
        "test_idempotent_{}.db",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let conn = establish_connection(&db_path).expect("connection should be established");
    initialize_database(&conn).expect("initial migration should succeed");

    // When
    let second_run = initialize_database(&conn);

    // Then
    assert!(
        second_run.is_ok(),
        "subsequent initialization should succeed idempotently"
    );

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM schema_migrations", [], |r| r.get(0))
        .expect("querying schema_migrations should succeed");
    assert_eq!(count, 7, "migration count must remain unchanged");

    drop(conn);
    let _ = std::fs::remove_file(db_path);
}

#[test]
fn test_given_legacy_database_with_existing_columns_when_migrating_then_safely_baselines_all_steps()
{
    // Given
    let conn = Connection::open_in_memory().expect("in-memory db open should succeed");
    conn.execute(
        "CREATE TABLE projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL,
            created_at TEXT NOT NULL,
            archived INTEGER DEFAULT 0
        )",
        [],
    )
    .expect("legacy table setup should succeed");

    // When
    let result = initialize_database(&conn);

    // Then
    assert!(
        result.is_ok(),
        "migration should safely detect existing column and succeed"
    );

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM schema_migrations", [], |r| r.get(0))
        .expect("querying schema_migrations should succeed");
    assert_eq!(count, 7, "all migrations should be baselined and recorded");
}
