use oxy_flow::engine::db::{init_db_in_memory, DataManager};
use rusqlite::params;

#[test]
fn test_db_initializes_in_memory() {
    let result = init_db_in_memory();
    assert!(
        result.is_ok(),
        "In-memory DB should initialize without error"
    );
}

#[test]
fn test_data_manager_creation() {
    let manager = DataManager::new_in_memory();
    assert!(
        manager.is_ok(),
        "Data manager should initialize sqlite connection"
    );
}

#[test]
fn test_data_manager_insert_project() {
    let manager = DataManager::new_in_memory().unwrap();
    let res = manager.insert_project("1", "TestProj", "red", "2026-06-15T12:00:00Z");
    assert!(res.is_ok());
}

#[test]
fn test_duplicate_project_name_fails() {
    let manager = DataManager::new_in_memory().unwrap();
    let now = "2026-06-15T12:00:00Z";

    assert!(manager
        .insert_project("1", "DuplicateProj", "red", now)
        .is_ok());
    assert!(manager
        .insert_project("2", "DuplicateProj", "blue", now)
        .is_err());
}

#[test]
fn test_foreign_key_constraints() {
    let manager = DataManager::new_in_memory().unwrap();
    let now = "2026-06-15T12:00:00Z";

    assert!(manager
        .insert_task("t1", "999", "Invalid Task", false, now)
        .is_err());
}

#[test]
fn test_cascade_delete() {
    let manager = DataManager::new_in_memory().unwrap();
    let now = "2026-06-15T12:00:00Z";

    manager.insert_project("p1", "Proj1", "red", now).unwrap();
    manager
        .insert_task("t1", "p1", "Task1", false, now)
        .unwrap();

    manager.conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES ('l1', 't1', ?, NULL)",
        params![now]
    ).unwrap();

    let task_count: i64 = manager
        .conn
        .query_row("SELECT COUNT(*) FROM tasks", [], |r| r.get(0))
        .unwrap();
    let log_count: i64 = manager
        .conn
        .query_row("SELECT COUNT(*) FROM time_logs", [], |r| r.get(0))
        .unwrap();
    assert_eq!(task_count, 1);
    assert_eq!(log_count, 1);

    manager
        .conn
        .execute("DELETE FROM projects WHERE id = 'p1'", [])
        .unwrap();

    let task_count_after: i64 = manager
        .conn
        .query_row("SELECT COUNT(*) FROM tasks", [], |r| r.get(0))
        .unwrap();
    let log_count_after: i64 = manager
        .conn
        .query_row("SELECT COUNT(*) FROM time_logs", [], |r| r.get(0))
        .unwrap();
    assert_eq!(task_count_after, 0);
    assert_eq!(log_count_after, 0);
}
