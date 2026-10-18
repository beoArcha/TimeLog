use crate::shared::test_db::setup_persistence_test;
use chrono::Utc;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{Project, Task};

#[test]
fn test_task_hierarchy_validation() {
    let (_conn, config, _temp_dir) = setup_persistence_test("engine_hierarchy");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = Project {
        id: "p_h".to_string(),
        name: "HierarchyProj".to_string(),
        color: "red".to_string(),
        created_at: Utc::now().to_rfc3339(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(project).unwrap();

    let task1 = Task {
        id: "t_h1".to_string(),
        project_id: "p_h".to_string(),
        parent_task_id: None,
        name: "Parent".to_string(),
        completed: false,
        created_at: Utc::now().to_rfc3339(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
    persistence.tasks.create(task1).unwrap();

    // 1. Same task as parent
    assert!(engine
        .validate_task_hierarchy(Some("t_h1"), Some("t_h1"))
        .is_err());

    // 2. Add valid subtask
    let task2 = Task {
        id: "t_h2".to_string(),
        project_id: "p_h".to_string(),
        parent_task_id: Some("t_h1".to_string()),
        name: "Subtask".to_string(),
        completed: false,
        created_at: Utc::now().to_rfc3339(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
    persistence.tasks.create_subtask(task2).unwrap();

    // 3. Try to add subtask to a subtask (invalid, depth > 1)
    assert!(engine.validate_task_hierarchy(None, Some("t_h2")).is_err());
}

#[test]
fn test_engine_edit_log_with_all_fields() {
    let (conn, config, _temp_dir) = setup_persistence_test("engine_edit_log_all");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = Project {
        id: "p_edit".to_string(),
        name: "EditProj".to_string(),
        color: "purple".to_string(),
        created_at: "2026-06-15T00:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(project).unwrap();

    let task1 = Task {
        id: "t_edit_1".to_string(),
        project_id: "p_edit".to_string(),
        parent_task_id: None,
        name: "EditTask1".to_string(),
        completed: false,
        created_at: "2026-06-15T00:00:00Z".to_string(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
    persistence.tasks.create(task1).unwrap();

    let task2 = Task {
        id: "t_edit_2".to_string(),
        project_id: "p_edit".to_string(),
        parent_task_id: None,
        name: "EditTask2".to_string(),
        completed: false,
        created_at: "2026-06-15T00:00:00Z".to_string(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
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
