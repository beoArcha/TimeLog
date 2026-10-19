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
    let conn = establish_connection(Path::new(":memory:"));
    assert!(conn.is_ok(), "In-memory DB should establish connection");
    let conn = conn.unwrap();
    let init_res = initialize_database(&conn);
    assert!(init_res.is_ok(), "In-memory DB should initialize schema");
}

#[test]
fn test_db_insert_project() {
    let conn = setup_in_memory();
    let res = conn.execute(
        "INSERT INTO projects (id, name, color, created_at) VALUES (?, ?, ?, ?)",
        ["p1", "TestProj", "red", "2026-06-15T12:00:00Z"],
    );
    assert!(res.is_ok());
}

#[test]
fn test_duplicate_project_name_fails() {
    let conn = setup_in_memory();
    let now = "2026-06-15T12:00:00Z";

    assert!(conn
        .execute(
            "INSERT INTO projects (id, name, color, created_at) VALUES (?, ?, ?, ?)",
            ["1", "DuplicateProj", "red", now]
        )
        .is_ok());
    assert!(conn
        .execute(
            "INSERT INTO projects (id, name, color, created_at) VALUES (?, ?, ?, ?)",
            ["2", "DuplicateProj", "blue", now]
        )
        .is_err());
}

#[test]
fn test_foreign_key_constraints() {
    let conn = setup_in_memory();
    let now = "2026-06-15T12:00:00Z";

    assert!(conn
        .execute(
            "INSERT INTO tasks (id, project_id, name, created_at) VALUES (?, ?, ?, ?)",
            ["t1", "999", "Invalid Task", now]
        )
        .is_err());
}

#[test]
fn test_cascade_delete() {
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

    let task_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM tasks", [], |r| r.get(0))
        .unwrap();
    let log_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM time_logs", [], |r| r.get(0))
        .unwrap();
    assert_eq!(task_count, 1);
    assert_eq!(log_count, 1);

    conn.execute("DELETE FROM projects WHERE id = 'p1'", [])
        .unwrap();

    let task_count_after: i64 = conn
        .query_row("SELECT COUNT(*) FROM tasks", [], |r| r.get(0))
        .unwrap();
    let log_count_after: i64 = conn
        .query_row("SELECT COUNT(*) FROM time_logs", [], |r| r.get(0))
        .unwrap();
    assert_eq!(task_count_after, 0);
    assert_eq!(log_count_after, 0);
}
