use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::commands::persistence::project::delete_project_by_id;
use oxy_flow::common::AppError;
use oxy_flow::engine::{Engine, EngineError};
use oxy_flow::persistence::Persistence;
use oxy_flow::types::NewTimeLog;

#[test]
fn test_given_project_with_logged_time_when_delete_attempted_then_returns_validation_error() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_delete_proj_with_time");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("proj_del_time")
        .with_name("Project With Time")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("task_del_time")
        .with_project_id("proj_del_time")
        .with_name("Task With Time")
        .build();
    persistence.tasks.create(task).unwrap();

    let log = NewTimeLog {
        id: "log_del_1".to_string(),
        task_id: "task_del_time".to_string(),
        start_time: "2026-06-22T10:00:00Z".to_string(),
        end_time: Some("2026-06-22T11:00:00Z".to_string()),
        note: None,
    };
    persistence.time_logs.insert_full(&log).unwrap();

    // Act
    let result = delete_project_by_id(&persistence, "proj_del_time");

    // Assert
    assert!(result.is_err());
    match result.unwrap_err() {
        AppError::Engine(EngineError::Validation(msg)) => {
            assert!(
                msg.contains("Cannot delete project with logged time"),
                "Expected logged time validation error, got: {}",
                msg
            );
        }
        other => panic!("Expected EngineError::Validation, got {:?}", other),
    }

    let proj = persistence.projects.get("proj_del_time").unwrap();
    assert!(proj.is_some());
}

#[test]
fn test_given_project_with_subtask_logged_time_when_delete_attempted_then_returns_validation_error()
{
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_delete_proj_subtask_time");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("proj_sub_time")
        .with_name("Project With Subtask Time")
        .build();
    persistence.projects.create(project).unwrap();

    let parent_task = TaskBuilder::new()
        .with_id("parent_task_1")
        .with_project_id("proj_sub_time")
        .with_name("Parent Task")
        .build();
    persistence.tasks.create(parent_task).unwrap();

    let subtask = TaskBuilder::new()
        .with_id("subtask_1")
        .with_project_id("proj_sub_time")
        .with_parent("parent_task_1")
        .with_name("Subtask")
        .build();
    persistence.tasks.create_subtask(subtask).unwrap();

    let log = NewTimeLog {
        id: "log_sub_1".to_string(),
        task_id: "subtask_1".to_string(),
        start_time: "2026-06-22T10:00:00Z".to_string(),
        end_time: Some("2026-06-22T10:30:00Z".to_string()),
        note: None,
    };
    persistence.time_logs.insert_full(&log).unwrap();

    // Act
    let result = delete_project_by_id(&persistence, "proj_sub_time");

    // Assert
    assert!(result.is_err());
    match result.unwrap_err() {
        AppError::Engine(EngineError::Validation(msg)) => {
            assert!(
                msg.contains("Cannot delete project with logged time"),
                "Expected logged time validation error, got: {}",
                msg
            );
        }
        other => panic!("Expected EngineError::Validation, got {:?}", other),
    }
}

#[test]
fn test_given_project_with_active_timer_when_delete_attempted_then_returns_active_timer_error() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_delete_proj_active_timer");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    let project = ProjectBuilder::new()
        .with_id("proj_active")
        .with_name("Project Active Timer")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("task_active")
        .with_project_id("proj_active")
        .with_name("Task Active")
        .build();
    persistence.tasks.create(task).unwrap();

    engine.start_timer("task_active").unwrap();

    // Act
    let result = delete_project_by_id(&persistence, "proj_active");

    // Assert
    assert!(result.is_err());
    match result.unwrap_err() {
        AppError::Engine(EngineError::Validation(msg)) => {
            assert!(
                msg.contains("Cannot delete project with active timer"),
                "Expected active timer validation error, got: {}",
                msg
            );
        }
        other => panic!("Expected EngineError::Validation, got {:?}", other),
    }

    engine.stop_timer(None).unwrap();
}

#[test]
fn test_given_project_with_zero_time_and_tasks_when_delete_attempted_then_cascades_and_removes_all()
{
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_delete_proj_zero_time");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("proj_zero")
        .with_name("Project Zero Time")
        .build();
    persistence.projects.create(project).unwrap();

    let parent_task = TaskBuilder::new()
        .with_id("parent_zero_1")
        .with_project_id("proj_zero")
        .with_name("Parent Zero Task")
        .build();
    persistence.tasks.create(parent_task).unwrap();

    let subtask = TaskBuilder::new()
        .with_id("subtask_zero_1")
        .with_project_id("proj_zero")
        .with_parent("parent_zero_1")
        .with_name("Subtask Zero")
        .build();
    persistence.tasks.create_subtask(subtask).unwrap();

    // Act
    let updated_state = delete_project_by_id(&persistence, "proj_zero").unwrap();

    // Assert: Check returned state
    assert!(!updated_state.projects.iter().any(|p| p.id == "proj_zero"));
    assert!(!updated_state
        .tasks
        .iter()
        .any(|t| t.project_id == "proj_zero"));

    // Assert: Check direct persistence
    assert!(persistence.projects.get("proj_zero").unwrap().is_none());
    assert!(persistence.tasks.get("parent_zero_1").unwrap().is_none());
    assert!(persistence.tasks.get("subtask_zero_1").unwrap().is_none());
}

#[test]
fn test_given_archived_project_with_zero_time_when_delete_attempted_then_succeeds() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_delete_archived_proj");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("proj_archived_zero")
        .with_name("Archived Zero Project")
        .archived(true)
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("task_archived_zero")
        .with_project_id("proj_archived_zero")
        .with_name("Task in Archived Project")
        .build();
    persistence.tasks.create(task).unwrap();

    // Act
    let updated_state = delete_project_by_id(&persistence, "proj_archived_zero").unwrap();

    // Assert
    assert!(!updated_state
        .projects
        .iter()
        .any(|p| p.id == "proj_archived_zero"));
    assert!(persistence
        .projects
        .get("proj_archived_zero")
        .unwrap()
        .is_none());
    assert!(persistence
        .tasks
        .get("task_archived_zero")
        .unwrap()
        .is_none());
}

#[test]
fn test_given_nonexistent_project_when_delete_attempted_then_returns_not_found() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_delete_proj_nonexistent");
    let persistence = Persistence::new(&config).unwrap();

    // Act
    let result = delete_project_by_id(&persistence, "nonexistent_proj_id");

    // Assert
    assert!(result.is_err());
    match result.unwrap_err() {
        AppError::Persistence(oxy_flow::persistence::PersistenceError::NotFound { entity, id }) => {
            assert_eq!(entity, "Project");
            assert_eq!(id, "nonexistent_proj_id");
        }
        other => panic!("Expected PersistenceError::NotFound, got {:?}", other),
    }
}

#[test]
fn test_given_project_when_repeatedly_deleted_then_second_attempt_returns_not_found() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_delete_proj_repeated");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("proj_repeat")
        .with_name("Repeat Project")
        .build();
    persistence.projects.create(project).unwrap();

    // Act
    let first = delete_project_by_id(&persistence, "proj_repeat");
    assert!(first.is_ok());

    let second = delete_project_by_id(&persistence, "proj_repeat");

    // Assert
    assert!(second.is_err());
    match second.unwrap_err() {
        AppError::Persistence(oxy_flow::persistence::PersistenceError::NotFound { entity, id }) => {
            assert_eq!(entity, "Project");
            assert_eq!(id, "proj_repeat");
        }
        other => panic!("Expected NotFound on second delete, got {:?}", other),
    }
}

#[test]
fn test_given_concurrent_time_log_creation_and_project_deletion_then_project_with_time_is_never_deleted(
) {
    use std::sync::Arc;
    use std::thread;

    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_delete_concurrent_time");
    let persistence = Arc::new(Persistence::new(&config).unwrap());

    let project = ProjectBuilder::new()
        .with_id("proj_concurrent")
        .with_name("Concurrent Project")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("task_concurrent")
        .with_project_id("proj_concurrent")
        .with_name("Concurrent Task")
        .build();
    persistence.tasks.create(task).unwrap();

    let p1 = Arc::clone(&persistence);
    let p2 = Arc::clone(&persistence);
    let barrier = Arc::new(std::sync::Barrier::new(2));
    let b1 = Arc::clone(&barrier);
    let b2 = Arc::clone(&barrier);

    // Act: Spawn concurrent threads for time log insertion and project deletion with barrier start
    let t1 = thread::spawn(move || {
        b1.wait();
        let log = NewTimeLog {
            id: "log_concurrent_1".to_string(),
            task_id: "task_concurrent".to_string(),
            start_time: "2026-06-22T10:00:00Z".to_string(),
            end_time: Some("2026-06-22T11:00:00Z".to_string()),
            note: None,
        };
        p1.time_logs.insert_full(&log)
    });

    let t2 = thread::spawn(move || {
        b2.wait();
        delete_project_by_id(&p2, "proj_concurrent")
    });

    let _ = t1.join().unwrap();
    let del_res = t2.join().unwrap();

    // Assert: Invariant verification
    let remaining_project = persistence.projects.get("proj_concurrent").unwrap();
    let remaining_logs = persistence.time_logs.get_all().unwrap();
    let project_has_logs = remaining_logs
        .iter()
        .any(|l| l.task_id == "task_concurrent");

    if project_has_logs {
        assert!(
            remaining_project.is_some(),
            "Project with tracked time must never be deleted!"
        );
        assert!(del_res.is_err(), "Delete must fail when time exists!");
    } else if del_res.is_ok() {
        assert!(
            remaining_project.is_none(),
            "Project without time must be deleted cleanly!"
        );
    }
}

#[test]
fn test_given_two_sqlite_connections_when_delete_holds_immediate_tx_then_concurrent_write_is_blocked_until_commit(
) {
    use rusqlite::{params, Connection, OpenFlags};
    use std::sync::mpsc;
    use std::thread;

    // Arrange: Create shared in-memory database
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_delete_two_conn_sync");
    let persistence = Persistence::new(&config).unwrap();

    let project = ProjectBuilder::new()
        .with_id("proj_sync_test")
        .with_name("Sync Project")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("task_sync_test")
        .with_project_id("proj_sync_test")
        .with_name("Sync Task")
        .build();
    persistence.tasks.create(task).unwrap();

    let db_path = config.db_path.clone();

    // Channels for controlled step-by-step synchronization between SQLite connections
    let (tx_in_immediate, rx_in_immediate) = mpsc::channel();
    let (tx_write_result, rx_write_result) = mpsc::channel();

    // Thread 1: Connection 1 begins BEGIN IMMEDIATE and holds the lock while checking validation
    let db_path_t1 = db_path.clone();
    let t1 = thread::spawn(move || {
        let mut conn1 = Connection::open_with_flags(
            &db_path_t1,
            OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_URI,
        )
        .unwrap();

        let tx = conn1
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)
            .unwrap();

        // Signal Thread 2: "I hold the IMMEDIATE reserved write lock"
        tx_in_immediate.send(()).unwrap();

        // Wait until Thread 2 attempts to write and reports back
        let (other_write_blocked,): (bool,) = rx_write_result.recv().unwrap();
        assert!(
            other_write_blocked,
            "Concurrent write on connection 2 MUST be blocked by connection 1's IMMEDIATE transaction!"
        );

        // Complete deletion in the transaction
        tx.execute(
            "DELETE FROM tasks WHERE project_id = ?1",
            params!["proj_sync_test"],
        )
        .unwrap();
        tx.execute(
            "DELETE FROM projects WHERE id = ?1",
            params!["proj_sync_test"],
        )
        .unwrap();
        tx.commit().unwrap();
    });

    // Thread 2: Connection 2 attempts to insert a time log while Thread 1 holds IMMEDIATE lock
    let db_path_t2 = db_path.clone();
    let t2 = thread::spawn(move || {
        // Wait until Thread 1 has acquired the BEGIN IMMEDIATE transaction lock
        rx_in_immediate.recv().unwrap();

        let conn2 = Connection::open_with_flags(
            &db_path_t2,
            OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_URI,
        )
        .unwrap();
        conn2
            .busy_timeout(std::time::Duration::from_millis(10))
            .unwrap();

        // Attempt a write operation on Connection 2
        let insert_res = conn2.execute(
            "INSERT INTO time_logs (id, task_id, start_time) VALUES (?1, ?2, ?3)",
            params!["log_sync_attempt", "task_sync_test", "2026-06-22T10:00:00Z"],
        );

        let is_blocked = match &insert_res {
            Err(rusqlite::Error::SqliteFailure(err, _)) => {
                err.code == rusqlite::ErrorCode::DatabaseBusy
                    || err.code == rusqlite::ErrorCode::DatabaseLocked
                    || err.extended_code == 5
                    || err.extended_code == 6
                    || err.extended_code == 261
                    || err.extended_code == 262
                    || err.extended_code == 517
            }
            _ => false,
        };

        tx_write_result.send((is_blocked,)).unwrap();
    });

    t1.join().unwrap();
    t2.join().unwrap();

    // Verify final state: project was deleted and no orphan logs were created
    assert!(persistence
        .projects
        .get("proj_sync_test")
        .unwrap()
        .is_none());
    assert!(persistence.tasks.get("task_sync_test").unwrap().is_none());
    let logs = persistence.time_logs.get_all().unwrap();
    assert!(!logs.iter().any(|l| l.id == "log_sync_attempt"));
}
