use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use chrono::Utc;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_validate_task_hierarchy_rejects_task_as_its_own_parent() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("engine_hierarchy_self");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_h")
        .with_name("HierarchyProj")
        .with_color("red")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_h1")
        .with_project_id("p_h")
        .with_name("Parent")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create(task).unwrap();

    // Act
    let result = engine.validate_task_hierarchy(Some("t_h1"), Some("t_h1"));

    // Assert
    assert!(result.is_err());
}

#[test]
fn test_validate_task_hierarchy_rejects_subtask_of_subtask() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("engine_hierarchy_depth");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_h")
        .with_name("HierarchyProj")
        .with_color("red")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.projects.create(project).unwrap();

    let parent_task = TaskBuilder::new()
        .with_id("t_h1")
        .with_project_id("p_h")
        .with_name("Parent")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create(parent_task).unwrap();

    let subtask = TaskBuilder::new()
        .with_id("t_h2")
        .with_project_id("p_h")
        .with_parent("t_h1")
        .with_name("Subtask")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create_subtask(subtask).unwrap();

    // Act
    let result = engine.validate_task_hierarchy(None, Some("t_h2"));

    // Assert
    assert!(result.is_err());
}

#[test]
fn test_engine_edit_log_with_all_fields() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_edit_log_all");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_edit")
        .with_name("EditProj")
        .with_color("purple")
        .with_created_at("2026-06-15T00:00:00Z")
        .build();
    persistence.projects.create(project).unwrap();

    let task1 = TaskBuilder::new()
        .with_id("t_edit_1")
        .with_project_id("p_edit")
        .with_name("EditTask1")
        .with_created_at("2026-06-15T00:00:00Z")
        .build();
    persistence.tasks.create(task1).unwrap();

    let task2 = TaskBuilder::new()
        .with_id("t_edit_2")
        .with_project_id("p_edit")
        .with_name("EditTask2")
        .with_created_at("2026-06-15T00:00:00Z")
        .build();
    persistence.tasks.create(task2).unwrap();

    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time, note) VALUES (?, ?, ?, ?, ?)",
        [
            "l_edit_1",
            "t_edit_1",
            "2026-06-15T08:00:00Z",
            "2026-06-15T09:00:00Z",
            "Old Note",
        ],
    )
    .unwrap();

    // Act
    engine
        .edit_log(
            "l_edit_1",
            "t_edit_2",
            "2026-06-15T08:15:00Z",
            Some("2026-06-15T09:15:00Z"),
            Some("New Note"),
            Some("Correction"),
        )
        .unwrap();

    // Assert
    let updated_log = persistence.time_logs.get_by_id("l_edit_1").unwrap();
    assert_eq!(updated_log.task_id, "t_edit_2");
    assert_eq!(updated_log.start_time, "2026-06-15T08:15:00Z");
    assert_eq!(
        updated_log.end_time.as_deref(),
        Some("2026-06-15T09:15:00Z")
    );
    assert_eq!(updated_log.note.as_deref(), Some("New Note"));
    assert!(!updated_log.edit_history.unwrap_or_default().is_empty());
}
