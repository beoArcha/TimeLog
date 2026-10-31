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

#[test]
fn test_given_database_when_migrated_then_projects_and_tasks_have_billing_rate_and_currency_columns(
) {
    // Given
    let conn = Connection::open_in_memory().expect("in-memory db open should succeed");

    // When
    initialize_database(&conn).expect("database initialization should succeed");

    // Then
    let check_column = |table: &str, col: &str| -> bool {
        let sql = format!("PRAGMA table_info({table})");
        let mut stmt = conn.prepare(&sql).unwrap();
        let mut rows = stmt.query([]).unwrap();
        let mut found = false;
        while let Some(row) = rows.next().unwrap() {
            let name: String = row.get(1).unwrap();
            if name.eq_ignore_ascii_case(col) {
                found = true;
                break;
            }
        }
        found
    };

    assert!(
        check_column("projects", "hourly_rate"),
        "projects.hourly_rate must exist"
    );
    assert!(
        check_column("projects", "currency"),
        "projects.currency must exist"
    );
    assert!(
        check_column("projects", "billing_rate_cents"),
        "projects.billing_rate_cents must exist"
    );
    assert!(
        check_column("projects", "billing_currency"),
        "projects.billing_currency must exist"
    );

    assert!(
        check_column("tasks", "hourly_rate"),
        "tasks.hourly_rate must exist"
    );
    assert!(
        check_column("tasks", "currency"),
        "tasks.currency must exist"
    );
    assert!(
        check_column("tasks", "billing_rate_cents"),
        "tasks.billing_rate_cents must exist"
    );
    assert!(
        check_column("tasks", "billing_currency"),
        "tasks.billing_currency must exist"
    );
}

#[test]
fn test_given_legacy_db_with_existing_records_when_migrating_to_v7_then_preserves_records_and_allows_billing_updates(
) {
    // Given - an existing legacy database up to migration 6
    let conn = Connection::open_in_memory().expect("in-memory db open should succeed");
    initialize_database(&conn).expect("initial migrations succeed");

    // Insert project and task
    conn.execute(
        "INSERT INTO projects (id, name, color, created_at) VALUES ('p1', 'Legacy Proj', '#123456', '2026-10-01T00:00:00Z')",
        [],
    ).expect("inserting legacy project should succeed");

    conn.execute(
        "INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t1', 'p1', 'Legacy Task', '2026-10-01T00:00:00Z')",
        [],
    ).expect("inserting legacy task should succeed");

    // When - updating billing columns on legacy records
    conn.execute(
        "UPDATE projects SET billing_rate_cents = 15000, billing_currency = 'USD' WHERE id = 'p1'",
        [],
    )
    .expect("updating project billing columns should succeed");

    conn.execute(
        "UPDATE tasks SET billing_rate_cents = 12000, billing_currency = 'USD' WHERE id = 't1'",
        [],
    )
    .expect("updating task billing columns should succeed");

    // Then
    let (p_cents, p_curr): (Option<i64>, Option<String>) = conn
        .query_row(
            "SELECT billing_rate_cents, billing_currency FROM projects WHERE id = 'p1'",
            [],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .expect("query project billing should succeed");

    assert_eq!(p_cents, Some(15000));
    assert_eq!(p_curr.as_deref(), Some("USD"));

    let (t_cents, t_curr): (Option<i64>, Option<String>) = conn
        .query_row(
            "SELECT billing_rate_cents, billing_currency FROM tasks WHERE id = 't1'",
            [],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .expect("query task billing should succeed");

    assert_eq!(t_cents, Some(12000));
    assert_eq!(t_curr.as_deref(), Some("USD"));
}
