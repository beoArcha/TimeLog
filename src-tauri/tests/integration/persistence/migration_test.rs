use oxyflow_timelog::repositories::shared::{establish_connection, initialize_database};
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
    assert_eq!(count, 9, "all 9 migration steps must be recorded");

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
    assert_eq!(count, 9, "migration count must remain unchanged");

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
    assert_eq!(count, 9, "all migrations should be baselined and recorded");
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
    assert!(
        check_column("time_logs_history", "audit_source"),
        "time_logs_history.audit_source must exist"
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

fn create_v8_database_with_legacy_history() -> Connection {
    let conn = Connection::open_in_memory().expect("in-memory db open should succeed");
    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;

        CREATE TABLE schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );

        CREATE TABLE time_logs (
            id TEXT PRIMARY KEY
        );

        CREATE TABLE time_logs_history (
            id TEXT PRIMARY KEY,
            time_log_id TEXT NOT NULL,
            edited_at TEXT NOT NULL,
            prev_start_time TEXT NOT NULL,
            prev_end_time TEXT,
            prev_note TEXT,
            reason TEXT NOT NULL,
            audit_source TEXT,
            FOREIGN KEY(time_log_id) REFERENCES time_logs(id) ON DELETE CASCADE
        );

        INSERT INTO time_logs (id) VALUES ('log-1');

        INSERT INTO time_logs_history (
            id, time_log_id, edited_at, prev_start_time,
            prev_end_time, prev_note, reason, audit_source
        ) VALUES (
            'history-1', 'log-1', '2026-11-06T10:00:00Z',
            '2026-11-06T09:00:00Z', '2026-11-06T09:30:00Z',
            'legacy note', 'manual correction', 'gui_edit'
        );
        ",
    )
    .expect("legacy v8 schema should be created");

    for version in 1..=8 {
        conn.execute(
            "INSERT INTO schema_migrations (version, applied_at) VALUES (?1, ?2)",
            rusqlite::params![version, "2026-11-06T00:00:00Z"],
        )
        .expect("legacy migration version should be recorded");
    }

    conn
}

fn history_reason_is_not_null(conn: &Connection) -> bool {
    let mut stmt = conn
        .prepare("PRAGMA table_info(time_logs_history)")
        .expect("table info query should prepare");
    let mut rows = stmt.query([]).expect("table info query should execute");

    while let Some(row) = rows.next().expect("table info row should be readable") {
        let name: String = row.get(1).expect("column name should be readable");
        if name == "reason" {
            let not_null: i64 = row.get(3).expect("notnull flag should be readable");
            return not_null != 0;
        }
    }

    panic!("time_logs_history.reason column should exist");
}

#[test]
fn test_given_v8_database_with_reason_not_null_when_migrating_then_reason_becomes_nullable() {
    let conn = create_v8_database_with_legacy_history();

    initialize_database(&conn).expect("migration 9 should succeed");

    assert!(
        !history_reason_is_not_null(&conn),
        "time_logs_history.reason must allow NULL after migration 9"
    );

    let version_9_exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = 9)",
            [],
            |row| row.get(0),
        )
        .expect("migration version should be queryable");
    assert!(version_9_exists, "migration 9 should be recorded");

    let audit_source: String = conn
        .query_row(
            "SELECT audit_source FROM time_logs_history WHERE id = 'history-1'",
            [],
            |row| row.get(0),
        )
        .expect("legacy audit_source should be preserved");
    assert_eq!(audit_source, "gui_edit");
}

#[test]
fn test_given_migrated_database_when_inserting_history_with_null_reason_then_succeeds() {
    let conn = create_v8_database_with_legacy_history();
    initialize_database(&conn).expect("migration 9 should succeed");

    conn.execute(
        "
        INSERT INTO time_logs_history (
            id, time_log_id, edited_at, prev_start_time,
            prev_end_time, prev_note, reason, audit_source
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        ",
        rusqlite::params![
            "history-2",
            "log-1",
            "2026-11-06T11:00:00Z",
            "2026-11-06T09:00:00Z",
            Option::<&str>::None,
            Option::<&str>::None,
            Option::<&str>::None,
            "CLI Edit"
        ],
    )
    .expect("history insert with NULL reason should succeed");

    let (reason, audit_source): (Option<String>, String) = conn
        .query_row(
            "SELECT reason, audit_source FROM time_logs_history WHERE id = 'history-2'",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .expect("inserted history should be readable");

    assert_eq!(reason, None);
    assert_eq!(audit_source, "CLI Edit");
}

#[test]
fn test_given_legacy_history_records_when_rebuilding_table_then_preserves_all_records() {
    let conn = create_v8_database_with_legacy_history();
    conn.execute(
        "
        INSERT INTO time_logs_history (
            id, time_log_id, edited_at, prev_start_time,
            prev_end_time, prev_note, reason, audit_source
        ) VALUES (
            'history-2', 'log-1', '2026-11-06T11:00:00Z',
            '2026-11-06T09:00:00Z', NULL, NULL,
            'second correction', 'cli_edit'
        )
        ",
        [],
    )
    .expect("second legacy history row should be inserted");

    initialize_database(&conn).expect("migration 9 should succeed");

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM time_logs_history", [], |row| {
            row.get(0)
        })
        .expect("history count should be queryable");
    assert_eq!(count, 2, "all legacy history rows must be preserved");

    let first: (String, Option<String>, Option<String>, String, String) = conn
        .query_row(
            "
            SELECT id, prev_end_time, prev_note, reason, audit_source
            FROM time_logs_history WHERE id = 'history-1'
            ",
            [],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                ))
            },
        )
        .expect("first history row should be preserved");
    assert_eq!(first.0, "history-1");
    assert_eq!(first.1.as_deref(), Some("2026-11-06T09:30:00Z"));
    assert_eq!(first.2.as_deref(), Some("legacy note"));
    assert_eq!(first.3, "manual correction");
    assert_eq!(first.4, "gui_edit");

    let second: (Option<String>, Option<String>, String, String) = conn
        .query_row(
            "
            SELECT prev_end_time, prev_note, reason, audit_source
            FROM time_logs_history WHERE id = 'history-2'
            ",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .expect("second history row should be preserved");
    assert_eq!(second.0, None);
    assert_eq!(second.1, None);
    assert_eq!(second.2, "second correction");
    assert_eq!(second.3, "cli_edit");
}

#[test]
fn test_given_migrated_history_table_when_deleting_time_log_then_cascades_history() {
    let conn = create_v8_database_with_legacy_history();
    initialize_database(&conn).expect("migration 9 should succeed");

    conn.execute("DELETE FROM time_logs WHERE id = 'log-1'", [])
        .expect("deleting parent time log should succeed");

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM time_logs_history", [], |row| {
            row.get(0)
        })
        .expect("history count should be queryable");
    assert_eq!(count, 0, "ON DELETE CASCADE should remove history rows");
}

#[test]
fn test_given_database_after_migration_9_when_initializing_again_then_is_idempotent() {
    let conn = create_v8_database_with_legacy_history();
    initialize_database(&conn).expect("first migration should succeed");

    let before: i64 = conn
        .query_row("SELECT COUNT(*) FROM time_logs_history", [], |row| {
            row.get(0)
        })
        .expect("history count should be queryable");

    initialize_database(&conn).expect("second initialization should succeed");

    let after: i64 = conn
        .query_row("SELECT COUNT(*) FROM time_logs_history", [], |row| {
            row.get(0)
        })
        .expect("history count should be queryable");
    let migration_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM schema_migrations", [], |row| {
            row.get(0)
        })
        .expect("migration count should be queryable");

    assert_eq!(
        before, after,
        "initialization must not duplicate or delete history"
    );
    assert_eq!(
        migration_count, 9,
        "migration 9 should be recorded exactly once"
    );
    assert!(!history_reason_is_not_null(&conn));
}

#[test]
fn test_given_migrated_v8_database_when_editing_log_without_reason_then_persistence_saves_audit() {
    use oxyflow_timelog::persistence::{Persistence, PersistenceConfig};
    use oxyflow_timelog::types::{AuditSource, TimeLogUpdateHistory};
    use std::path::PathBuf;

    let unique = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("system clock should be after UNIX epoch")
        .as_nanos();
    let db_path = PathBuf::from(format!(
        "file:migration_9_persistence_{unique}?mode=memory&cache=shared"
    ));
    let conn = Connection::open_with_flags(
        &db_path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_WRITE
            | rusqlite::OpenFlags::SQLITE_OPEN_CREATE
            | rusqlite::OpenFlags::SQLITE_OPEN_URI,
    )
    .expect("shared in-memory database should open");

    conn.pragma_update(None, "foreign_keys", "ON")
        .expect("foreign keys should be enabled");
    conn.execute_batch(
        "
        CREATE TABLE schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );

        CREATE TABLE tasks (id TEXT PRIMARY KEY);

        CREATE TABLE time_logs (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            note TEXT,
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );

        CREATE TABLE time_logs_history (
            id TEXT PRIMARY KEY,
            time_log_id TEXT NOT NULL,
            edited_at TEXT NOT NULL,
            prev_start_time TEXT NOT NULL,
            prev_end_time TEXT,
            prev_note TEXT,
            reason TEXT NOT NULL,
            audit_source TEXT,
            FOREIGN KEY(time_log_id) REFERENCES time_logs(id) ON DELETE CASCADE
        );

        INSERT INTO tasks (id) VALUES ('task-1');
        INSERT INTO time_logs (
            id, task_id, start_time, end_time, note
        ) VALUES (
            'log-1', 'task-1', '2026-11-06T09:00:00Z',
            '2026-11-06T09:30:00Z', 'original note'
        );
        INSERT INTO time_logs_history (
            id, time_log_id, edited_at, prev_start_time,
            prev_end_time, prev_note, reason, audit_source
        ) VALUES (
            'history-1', 'log-1', '2026-11-06T09:30:00Z',
            '2026-11-06T09:00:00Z', '2026-11-06T09:30:00Z',
            'original note', 'legacy reason', 'GUI Edit'
        );
        ",
    )
    .expect("legacy v8 schema and records should be created");

    for version in 1..=8 {
        conn.execute(
            "INSERT INTO schema_migrations (version, applied_at) VALUES (?1, ?2)",
            rusqlite::params![version, "2026-11-06T00:00:00Z"],
        )
        .expect("legacy migration version should be recorded");
    }

    let csv_directory = std::env::temp_dir().join(format!("migration_9_csv_{unique}"));
    std::fs::create_dir_all(&csv_directory).expect("CSV directory should be created");
    let config = PersistenceConfig {
        db_path,
        csv_directory: csv_directory.clone(),
    };
    let persistence =
        Persistence::new(&config).expect("persistence initialization should apply migration 9");

    let edit = TimeLogUpdateHistory {
        id: "log-1",
        task_id: "task-1",
        start_time: "2026-11-06T09:05:00Z",
        end_time: Some("2026-11-06T09:30:00Z"),
        note: Some("edited note"),
        history_id: "history-2",
        edited_at: "2026-11-06T10:00:00Z",
        prev_start_time: Some("2026-11-06T09:00:00Z"),
        prev_end_time: Some("2026-11-06T09:30:00Z"),
        prev_note: Some("original note"),
        reason: None,
        audit_source: Some(AuditSource::CliEdit),
    };

    persistence
        .time_logs
        .update_with_history(&edit)
        .expect("log edit with NULL reason should succeed through persistence");

    let (reason, audit_source): (Option<String>, String) = conn
        .query_row(
            "SELECT reason, audit_source FROM time_logs_history WHERE id = 'history-2'",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .expect("new audit history should be readable");
    assert_eq!(reason, None);
    assert_eq!(audit_source, "CLI Edit");

    drop(persistence);
    drop(conn);
    let _ = std::fs::remove_dir_all(csv_directory);
}
