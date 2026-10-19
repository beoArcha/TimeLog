use crate::shared::builders::{ProjectBuilder, TaskBuilder, TimeLogBuilder};
use oxy_flow::repositories::business::BusinessRepository;
use oxy_flow::types::{TaskStatus, TimeLogEditHistory};

#[test]
fn test_business_repository_override_state_full_hierarchy() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_override_state_full.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }

    let repo = BusinessRepository::new(&db_path).unwrap();

    let initial_project = ProjectBuilder::new()
        .with_id("p_init")
        .with_name("Initial Project")
        .with_color("red")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_project(&initial_project).unwrap();

    let new_projects = vec![ProjectBuilder::new()
        .with_id("p1")
        .with_name("Project 1")
        .with_color("blue")
        .with_created_at("2026-06-23T10:00:00Z")
        .with_description("Description 1")
        .with_icon("icon-code")
        .with_tags(vec!["tagA".to_string(), "tagB".to_string()])
        .build()];

    let new_tasks = vec![
        TaskBuilder::new()
            .with_id("t_child")
            .with_project_id("p1")
            .with_parent("t_parent")
            .with_name("Child Subtask")
            .with_created_at("2026-06-23T10:05:00Z")
            .with_status(TaskStatus::Blocked)
            .build(),
        TaskBuilder::new()
            .with_id("t_parent")
            .with_project_id("p1")
            .with_name("Parent Task")
            .with_created_at("2026-06-23T10:01:00Z")
            .with_status(TaskStatus::InProgress)
            .build(),
    ];

    let new_logs = vec![TimeLogBuilder::new()
        .with_id("l1")
        .with_project_id("p1")
        .with_task_id("t_parent")
        .with_start_time("2026-06-23T10:10:00Z")
        .with_end_time(Some("2026-06-23T10:40:00Z".to_string()))
        .with_note("Initial session")
        .with_edit_history(vec![TimeLogEditHistory {
            edited_at: "2026-06-23T11:00:00Z".to_string(),
            prev_start_time: Some("2026-06-23T10:00:00Z".to_string()),
            prev_end_time: Some("2026-06-23T10:30:00Z".to_string()),
            prev_note: None,
            reason: Some("Adjusted minutes".to_string()),
        }])
        .build()];

    // Act
    repo.override_state(Some(new_projects), Some(new_tasks), Some(new_logs))
        .unwrap();

    // Assert
    assert!(repo.get_project("p_init").unwrap().is_none());

    let p1 = repo.get_project("p1").unwrap().unwrap();
    assert_eq!(p1.name, "Project 1");
    assert_eq!(p1.tags, Some(vec!["tagA".to_string(), "tagB".to_string()]));

    let t_parent = repo.get_task("t_parent").unwrap().unwrap();
    assert_eq!(t_parent.status, Some(TaskStatus::InProgress));

    let t_child = repo.get_task("t_child").unwrap().unwrap();
    assert_eq!(t_child.status, Some(TaskStatus::Blocked));
    assert_eq!(t_child.parent_task_id, Some("t_parent".to_string()));

    let logs = repo.get_all_time_logs().unwrap();
    assert_eq!(logs.len(), 1);
    assert_eq!(logs[0].id, "l1");
    assert_eq!(logs[0].edit_history.as_ref().map(|h| h.len()), Some(1));

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_business_repository_delete_time_log() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_delete_time_log.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }

    let repo = BusinessRepository::new(&db_path).unwrap();

    let project = ProjectBuilder::new()
        .with_id("p_del")
        .with_name("Del Project")
        .with_color("cyan")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_project(&project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_del")
        .with_project_id("p_del")
        .with_name("Del Task")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_task(&task).unwrap();

    repo.insert_time_log("tl_1", "t_del", "2026-06-22T20:00:00Z")
        .unwrap();
    repo.insert_time_log("tl_2", "t_del", "2026-06-22T21:00:00Z")
        .unwrap();

    // Act
    let rows_deleted = repo.delete_time_log("tl_1").unwrap();

    // Assert
    assert_eq!(rows_deleted, 1);

    let remaining_logs = repo.get_all_time_logs().unwrap();
    assert_eq!(remaining_logs.len(), 1);
    assert_eq!(remaining_logs[0].id, "tl_2");

    let _ = std::fs::remove_file(&db_path);
}
