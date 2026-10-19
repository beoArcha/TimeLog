use crate::shared::test_db::setup_persistence_test;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{Project, Task};

#[test]
fn test_validate_time_log_invalid_formats_and_future() {
    let (_conn, config, _temp_dir) = setup_persistence_test("val_time_log_1");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    // Invalid start time format
    let err_start = engine.validate_time_log("log_1", "task_1", "not-a-date", None);
    assert!(err_start.is_err());

    // Invalid end time format
    let err_end = engine.validate_time_log(
        "log_1",
        "task_1",
        "2025-01-01T10:00:00Z",
        Some("invalid-end"),
    );
    assert!(err_end.is_err());

    // End time before start time
    let err_order = engine.validate_time_log(
        "log_1",
        "task_1",
        "2025-01-01T12:00:00Z",
        Some("2025-01-01T10:00:00Z"),
    );
    assert!(err_order.is_err());

    // Start time in the future
    let future_time = (chrono::Utc::now() + chrono::Duration::hours(24)).to_rfc3339();
    let err_future = engine.validate_time_log("log_1", "task_1", &future_time, None);
    assert!(err_future.is_err());
}

#[test]
fn test_validate_time_log_overlap() {
    let (_conn, config, _temp_dir) = setup_persistence_test("val_time_log_2");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let proj = Project {
        id: "p1".to_string(),
        name: "Proj1".to_string(),
        color: "blue".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(proj).unwrap();

    let task = Task {
        id: "t1".to_string(),
        project_id: "p1".to_string(),
        parent_task_id: None,
        name: "Task1".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        completed: false,
        status: None,
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    persistence.tasks.create(task).unwrap();

    persistence
        .time_logs
        .insert("log_existing", "t1", "2025-01-01T10:00:00Z")
        .unwrap();
    persistence
        .time_logs
        .close_all_active("2025-01-01T11:00:00Z")
        .unwrap();

    // Overlapping interval
    let overlap_err = engine.validate_time_log(
        "log_new",
        "t1",
        "2025-01-01T10:30:00Z",
        Some("2025-01-01T11:30:00Z"),
    );
    assert!(overlap_err.is_err());

    // Non-overlapping interval
    let ok_res = engine.validate_time_log(
        "log_new_2",
        "t1",
        "2025-01-01T12:00:00Z",
        Some("2025-01-01T13:00:00Z"),
    );
    assert!(ok_res.is_ok());

    // Future end time
    let future_end = (chrono::Utc::now() + chrono::Duration::hours(24)).to_rfc3339();
    let err_future_end =
        engine.validate_time_log("log_1", "task_1", "2025-01-01T10:00:00Z", Some(&future_end));
    assert!(err_future_end.is_err());

    // Active log overlap (end_time is None in DB)
    let now_minus_1h = (chrono::Utc::now() - chrono::Duration::hours(1)).to_rfc3339();
    persistence
        .time_logs
        .insert("log_active_val", "t1", &now_minus_1h)
        .unwrap();

    let now_minus_30m = (chrono::Utc::now() - chrono::Duration::minutes(30)).to_rfc3339();
    let now_plus_10m = (chrono::Utc::now() - chrono::Duration::minutes(10)).to_rfc3339();
    let overlap_active =
        engine.validate_time_log("log_new_active", "t1", &now_minus_30m, Some(&now_plus_10m));
    assert!(overlap_active.is_err());
}

#[test]
fn test_validate_task_hierarchy_deep_nesting_and_cycles() {
    let (_conn, config, _temp_dir) = setup_persistence_test("val_task_hierarchy");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let proj = Project {
        id: "p1".to_string(),
        name: "Proj1".to_string(),
        color: "blue".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(proj).unwrap();

    // Self parent
    let self_parent_err = engine.validate_task_hierarchy(Some("t1"), Some("t1"));
    assert!(self_parent_err.is_err());

    let parent_task = Task {
        id: "parent_1".to_string(),
        project_id: "p1".to_string(),
        parent_task_id: None,
        name: "Parent".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        completed: false,
        status: None,
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    persistence.tasks.create(parent_task).unwrap();

    let child_task = Task {
        id: "child_1".to_string(),
        project_id: "p1".to_string(),
        parent_task_id: Some("parent_1".to_string()),
        name: "Child".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        completed: false,
        status: None,
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    persistence.tasks.create(child_task).unwrap();

    // Deep nesting (child has parent, cannot be parent of another task)
    let deep_nest_err = engine.validate_task_hierarchy(Some("grandchild_1"), Some("child_1"));
    assert!(deep_nest_err.is_err());

    // Setting parent for a task that already has subtasks
    let subtask_parent_err = engine.validate_task_hierarchy(Some("parent_1"), Some("child_1"));
    assert!(subtask_parent_err.is_err());

    // Valid hierarchy
    let valid_res = engine.validate_task_hierarchy(Some("new_child"), Some("parent_1"));
    assert!(valid_res.is_ok());

    // Root task without parent
    let valid_root = engine.validate_task_hierarchy(Some("root_task"), None);
    assert!(valid_root.is_ok());
}
