use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_validate_time_log_invalid_formats_and_future() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("val_time_log_1");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    let future_time = (chrono::Utc::now() + chrono::Duration::hours(24)).to_rfc3339();

    // Act
    let err_start = engine.validate_time_log("log_1", "task_1", "not-a-date", None);
    let err_end = engine.validate_time_log(
        "log_1",
        "task_1",
        "2025-01-01T10:00:00Z",
        Some("invalid-end"),
    );
    let err_order = engine.validate_time_log(
        "log_1",
        "task_1",
        "2025-01-01T12:00:00Z",
        Some("2025-01-01T10:00:00Z"),
    );
    let err_future = engine.validate_time_log("log_1", "task_1", &future_time, None);

    // Assert
    assert!(err_start.is_err(), "Invalid start format should fail");
    assert!(err_end.is_err(), "Invalid end format should fail");
    assert!(err_order.is_err(), "End before start should fail");
    assert!(err_future.is_err(), "Future start time should fail");
}

#[test]
fn test_validate_time_log_overlap() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("val_time_log_2");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new().with_id("p1").build();
    persistence.projects.create(proj).unwrap();

    let task = TaskBuilder::new()
        .with_id("t1")
        .with_project_id("p1")
        .build();
    persistence.tasks.create(task).unwrap();

    persistence
        .time_logs
        .insert("log_existing", "t1", "2025-01-01T10:00:00Z")
        .unwrap();
    persistence
        .time_logs
        .close_all_active("2025-01-01T11:00:00Z")
        .unwrap();

    let future_end = (chrono::Utc::now() + chrono::Duration::hours(24)).to_rfc3339();
    let now_minus_1h = (chrono::Utc::now() - chrono::Duration::hours(1)).to_rfc3339();
    persistence
        .time_logs
        .insert("log_active_val", "t1", &now_minus_1h)
        .unwrap();

    let now_minus_30m = (chrono::Utc::now() - chrono::Duration::minutes(30)).to_rfc3339();
    let now_plus_10m = (chrono::Utc::now() - chrono::Duration::minutes(10)).to_rfc3339();

    // Act
    let overlap_err = engine.validate_time_log(
        "log_new",
        "t1",
        "2025-01-01T10:30:00Z",
        Some("2025-01-01T11:30:00Z"),
    );
    let ok_res = engine.validate_time_log(
        "log_new_2",
        "t1",
        "2025-01-01T12:00:00Z",
        Some("2025-01-01T13:00:00Z"),
    );
    let err_future_end =
        engine.validate_time_log("log_1", "task_1", "2025-01-01T10:00:00Z", Some(&future_end));
    let overlap_active =
        engine.validate_time_log("log_new_active", "t1", &now_minus_30m, Some(&now_plus_10m));

    // Assert
    assert!(overlap_err.is_err(), "Overlapping closed log should fail");
    assert!(ok_res.is_ok(), "Disjoint interval should succeed");
    assert!(err_future_end.is_err(), "Future end time should fail");
    assert!(overlap_active.is_err(), "Overlapping open log should fail");
}

#[test]
fn test_validate_task_hierarchy_deep_nesting_and_cycles() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("val_task_hierarchy");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new().with_id("p1").build();
    persistence.projects.create(proj).unwrap();

    let parent_task = TaskBuilder::new()
        .with_id("parent_1")
        .with_project_id("p1")
        .build();
    persistence.tasks.create(parent_task).unwrap();

    let child_task = TaskBuilder::new()
        .with_id("child_1")
        .with_project_id("p1")
        .with_parent("parent_1")
        .build();
    persistence.tasks.create(child_task).unwrap();

    // Act
    let self_parent_err = engine.validate_task_hierarchy(Some("t1"), Some("t1"));
    let deep_nest_err = engine.validate_task_hierarchy(Some("grandchild_1"), Some("child_1"));
    let subtask_parent_err = engine.validate_task_hierarchy(Some("parent_1"), Some("child_1"));
    let valid_res = engine.validate_task_hierarchy(Some("new_child"), Some("parent_1"));
    let valid_root = engine.validate_task_hierarchy(Some("root_task"), None);

    // Assert
    assert!(self_parent_err.is_err(), "Self-parenting should fail");
    assert!(
        deep_nest_err.is_err(),
        "Deep nesting > 2 levels should fail"
    );
    assert!(
        subtask_parent_err.is_err(),
        "Cyclic parent assignment should fail"
    );
    assert!(
        valid_res.is_ok(),
        "Valid 1-level subtask hierarchy should succeed"
    );
    assert!(
        valid_root.is_ok(),
        "Root task without parent should succeed"
    );
}
