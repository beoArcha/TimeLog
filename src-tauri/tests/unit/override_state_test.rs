use oxy_flow::repositories::business::BusinessRepository;
use oxy_flow::types::{Project, Task, TaskStatus, TimeLog};

#[test]
fn test_business_repository_override_state_full_hierarchy() {
    let db_path = std::env::temp_dir().join("test_override_state_full.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }

    let repo = BusinessRepository::new(&db_path).unwrap();

    // Initial state
    let initial_project = Project {
        id: "p_init".to_string(),
        name: "Initial Project".to_string(),
        color: "red".to_string(),
        created_at: "2026-06-22T20:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    repo.create_project(&initial_project).unwrap();

    // Prepare override dataset
    let new_projects = vec![Project {
        id: "p1".to_string(),
        name: "Project 1".to_string(),
        color: "blue".to_string(),
        created_at: "2026-06-23T10:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: Some("Description 1".to_string()),
        icon: Some("icon-code".to_string()),
        tags: Some(vec!["tagA".to_string(), "tagB".to_string()]),
    }];

    let new_tasks = vec![
        // Intentionally put child subtask before parent task in vector to test root partition ordering
        Task {
            id: "t_child".to_string(),
            project_id: "p1".to_string(),
            parent_task_id: Some("t_parent".to_string()),
            name: "Child Subtask".to_string(),
            completed: false,
            created_at: "2026-06-23T10:05:00Z".to_string(),
            original_name: None,
            original_completed: None,
            edit_history: None,
            archived: Some(false),
            status: Some(TaskStatus::Blocked),
        },
        Task {
            id: "t_parent".to_string(),
            project_id: "p1".to_string(),
            parent_task_id: None,
            name: "Parent Task".to_string(),
            completed: false,
            created_at: "2026-06-23T10:01:00Z".to_string(),
            original_name: None,
            original_completed: None,
            edit_history: None,
            archived: Some(false),
            status: Some(TaskStatus::InProgress),
        },
    ];

    let new_logs = vec![TimeLog {
        id: "l1".to_string(),
        task_id: "t_parent".to_string(),
        project_id: "p1".to_string(),
        start_time: "2026-06-23T10:10:00Z".to_string(),
        end_time: Some("2026-06-23T10:40:00Z".to_string()),
        note: Some("Initial session".to_string()),
        edit_history: Some(vec![oxy_flow::types::TimeLogEditHistory {
            edited_at: "2026-06-23T11:00:00Z".to_string(),
            prev_start_time: Some("2026-06-23T10:00:00Z".to_string()),
            prev_end_time: Some("2026-06-23T10:30:00Z".to_string()),
            prev_note: None,
            reason: Some("Adjusted minutes".to_string()),
        }]),
    }];

    repo.override_state(Some(new_projects), Some(new_tasks), Some(new_logs))
        .unwrap();

    // Verify initial project was wiped
    assert!(repo.get_project("p_init").unwrap().is_none());

    // Verify new project and tags restored
    let p1 = repo.get_project("p1").unwrap().unwrap();
    assert_eq!(p1.name, "Project 1");
    assert_eq!(p1.tags, Some(vec!["tagA".to_string(), "tagB".to_string()]));

    // Verify tasks and status serialization
    let t_parent = repo.get_task("t_parent").unwrap().unwrap();
    assert_eq!(t_parent.status, Some(TaskStatus::InProgress));

    let t_child = repo.get_task("t_child").unwrap().unwrap();
    assert_eq!(t_child.status, Some(TaskStatus::Blocked));
    assert_eq!(t_child.parent_task_id, Some("t_parent".to_string()));

    // Verify time log and edit history
    let logs = repo.get_all_time_logs().unwrap();
    assert_eq!(logs.len(), 1);
    assert_eq!(logs[0].id, "l1");
    assert_eq!(logs[0].edit_history.as_ref().map(|h| h.len()), Some(1));

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_business_repository_delete_time_log() {
    let db_path = std::env::temp_dir().join("test_delete_time_log.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }

    let repo = BusinessRepository::new(&db_path).unwrap();

    let project = Project {
        id: "p_del".to_string(),
        name: "Del Project".to_string(),
        color: "cyan".to_string(),
        created_at: "2026-06-22T20:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    repo.create_project(&project).unwrap();

    let task = Task {
        id: "t_del".to_string(),
        project_id: "p_del".to_string(),
        parent_task_id: None,
        name: "Del Task".to_string(),
        completed: false,
        created_at: "2026-06-22T20:00:00Z".to_string(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(TaskStatus::Todo),
    };
    repo.create_task(&task).unwrap();

    repo.insert_time_log("tl_1", "t_del", "2026-06-22T20:00:00Z")
        .unwrap();
    repo.insert_time_log("tl_2", "t_del", "2026-06-22T21:00:00Z")
        .unwrap();

    assert_eq!(repo.get_all_time_logs().unwrap().len(), 2);

    let rows_deleted = repo.delete_time_log("tl_1").unwrap();
    assert_eq!(rows_deleted, 1);

    let remaining_logs = repo.get_all_time_logs().unwrap();
    assert_eq!(remaining_logs.len(), 1);
    assert_eq!(remaining_logs[0].id, "tl_2");

    let _ = std::fs::remove_file(&db_path);
}
