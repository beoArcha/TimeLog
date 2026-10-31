use oxy_flow::repositories::shared::{establish_connection, initialize_database};
use rusqlite::{params, Connection};
use std::path::Path;

fn setup_in_memory() -> Connection {
    let conn = establish_connection(Path::new(":memory:")).unwrap();
    initialize_database(&conn).unwrap();
    conn
}

#[test]
fn test_db_initializes_in_memory() {
    // Arrange
    let conn = establish_connection(Path::new(":memory:")).unwrap();

    // Act
    let init_res = initialize_database(&conn);

    // Assert
    assert!(init_res.is_ok(), "In-memory DB should initialize schema");
}

#[test]
fn test_db_insert_project() {
    // Arrange
    let conn = setup_in_memory();

    // Act
    let res = conn.execute(
        "INSERT INTO projects (id, name, color, created_at) VALUES (?, ?, ?, ?)",
        ["p1", "TestProj", "red", "2026-06-15T12:00:00Z"],
    );

    // Assert
    assert!(res.is_ok());
}

#[test]
fn test_duplicate_project_name_fails() {
    // Arrange
    let conn = setup_in_memory();
    let now = "2026-06-15T12:00:00Z";
    conn.execute(
        "INSERT INTO projects (id, name, color, created_at) VALUES (?, ?, ?, ?)",
        ["1", "DuplicateProj", "red", now],
    )
    .unwrap();

    // Act
    let result = conn.execute(
        "INSERT INTO projects (id, name, color, created_at) VALUES (?, ?, ?, ?)",
        ["2", "DuplicateProj", "blue", now],
    );

    // Assert
    assert!(result.is_err());
}

#[test]
fn test_foreign_key_constraints() {
    // Arrange
    let conn = setup_in_memory();
    let now = "2026-06-15T12:00:00Z";

    // Act
    let result = conn.execute(
        "INSERT INTO tasks (id, project_id, name, created_at) VALUES (?, ?, ?, ?)",
        ["t1", "999", "Invalid Task", now],
    );

    // Assert
    assert!(result.is_err());
}

#[test]
fn test_cascade_delete() {
    // Arrange
    let conn = setup_in_memory();
    let now = "2026-06-15T12:00:00Z";

    conn.execute(
        "INSERT INTO projects (id, name, color, created_at) VALUES ('p1', 'Proj1', 'red', ?)",
        params![now],
    )
    .unwrap();

    conn.execute(
        "INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t1', 'p1', 'Task1', ?)",
        params![now],
    )
    .unwrap();

    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES ('l1', 't1', ?, NULL)",
        params![now],
    )
    .unwrap();

    // Act
    conn.execute("DELETE FROM projects WHERE id = 'p1'", [])
        .unwrap();

    // Assert
    let task_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM tasks", [], |r| r.get(0))
        .unwrap();
    let log_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM time_logs", [], |r| r.get(0))
        .unwrap();
    assert_eq!(task_count, 0);
    assert_eq!(log_count, 0);
}

#[test]
fn test_initialize_database_records_migrations_in_memory() {
    // Arrange
    let conn = setup_in_memory();

    // Act
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM schema_migrations", [], |r| r.get(0))
        .unwrap();

    // Assert
    assert_eq!(count, 7);
}

#[test]
fn test_initialize_database_subsequent_call_is_idempotent() {
    // Arrange
    let conn = setup_in_memory();

    // Act
    let second_run = initialize_database(&conn);

    // Assert
    assert!(second_run.is_ok());
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM schema_migrations", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 7);
}
