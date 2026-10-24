use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use oxy_flow::repositories::business::BusinessRepository;
use oxy_flow::repositories::shared::errors::RepositoryError;

#[test]
fn test_business_repository_create_and_patch_project() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_business_repo_patch.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = BusinessRepository::new(&db_path).unwrap();

    let project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Project 1")
        .with_color("red")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_project(&project).unwrap();

    let mut p_patched = repo.get_project("p1").unwrap().unwrap();
    p_patched.name = "Project 1 Patched".to_string();

    // Act
    repo.patch_project(&p_patched).unwrap();

    // Assert
    let p_saved = repo.get_project("p1").unwrap().unwrap();
    assert_eq!(p_saved.name, "Project 1 Patched");
    assert_eq!(p_saved.archived, Some(false));

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_business_repository_create_task_and_subtask_hierarchy() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_business_repo_hierarchy.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = BusinessRepository::new(&db_path).unwrap();

    let project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Project 1")
        .with_color("red")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_project(&project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t1")
        .with_project_id("p1")
        .with_name("Task 1")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_task(&task).unwrap();

    let subtask = TaskBuilder::new()
        .with_id("st1")
        .with_project_id("p1")
        .with_parent("t1")
        .with_name("Subtask 1")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();

    // Act
    repo.create_subtask(&subtask).unwrap();

    // Assert
    let tasks = repo.get_tasks_for_project("p1").unwrap();
    assert_eq!(tasks.len(), 1);
    assert_eq!(tasks[0].id, "t1");

    let subtasks = repo.get_subtasks_for_task("t1").unwrap();
    assert_eq!(subtasks.len(), 1);
    assert_eq!(subtasks[0].id, "st1");
    assert_eq!(subtasks[0].parent_task_id, Some("t1".to_string()));

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_business_repository_archive_project() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_business_repo_archive.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = BusinessRepository::new(&db_path).unwrap();

    let project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Project 1")
        .with_color("red")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_project(&project).unwrap();

    // Act
    repo.archive_project("p1").unwrap();

    // Assert
    let p_archived = repo.get_project("p1").unwrap().unwrap();
    assert_eq!(p_archived.archived, Some(true));

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_business_repository_get_all_returns_persisted_entities() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_business_repo_get_all.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = BusinessRepository::new(&db_path).unwrap();

    let project = ProjectBuilder::new()
        .with_id("p_all")
        .with_name("Project All")
        .with_color("blue")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_project(&project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_all")
        .with_project_id("p_all")
        .with_name("Task All")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_task(&task).unwrap();
    repo.insert_time_log("tl_all", "t_all", "2026-06-22T20:00:00Z")
        .unwrap();

    // Act
    let all_projects = repo.get_all_projects().unwrap();
    let all_tasks = repo.get_all_tasks().unwrap();
    let all_logs = repo.get_all_time_logs().unwrap();

    // Assert
    assert_eq!(all_projects.len(), 1);
    assert_eq!(all_tasks.len(), 1);
    assert_eq!(all_logs.len(), 1);

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_business_repository_clear_all_data_wipes_all_entities() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_business_repo_clear.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = BusinessRepository::new(&db_path).unwrap();

    let project = ProjectBuilder::new()
        .with_id("p_clear")
        .with_name("Project Clear")
        .with_color("blue")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_project(&project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_clear")
        .with_project_id("p_clear")
        .with_name("Task Clear")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_task(&task).unwrap();
    repo.insert_time_log("tl_clear", "t_clear", "2026-06-22T20:00:00Z")
        .unwrap();

    // Act
    repo.clear_all_data().unwrap();

    // Assert
    assert_eq!(repo.get_all_projects().unwrap().len(), 0);
    assert_eq!(repo.get_all_tasks().unwrap().len(), 0);
    assert_eq!(repo.get_all_time_logs().unwrap().len(), 0);

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_business_repository_debug_introspection_and_update() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_business_repo_debug.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = BusinessRepository::new(&db_path).unwrap();

    let project = ProjectBuilder::new()
        .with_id("p_dbg")
        .with_name("Debug Project")
        .with_color("purple")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_project(&project).unwrap();

    // Act
    let tables = repo.debug_get_tables().unwrap();
    let rows_resp = repo.debug_get_table_rows("projects", 10, 0).unwrap();
    repo.debug_update_cell("projects", "id", "p_dbg", "name", "Updated Via Debug")
        .unwrap();
    let updated_rows = repo.debug_get_table_rows("projects", 10, 0).unwrap();

    // Assert
    assert!(tables.contains(&"projects".to_string()));
    assert!(tables.contains(&"tasks".to_string()));
    assert_eq!(rows_resp.total_count, 1);
    assert_eq!(
        rows_resp.rows[0].get("name").unwrap(),
        &serde_json::json!("Debug Project")
    );
    assert_eq!(
        updated_rows.rows[0].get("name").unwrap(),
        &serde_json::json!("Updated Via Debug")
    );

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_business_repository_corrupted_json_fails() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_business_repo_corrupt_json.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = BusinessRepository::new(&db_path).unwrap();

    let project = ProjectBuilder::new()
        .with_id("p_corrupt")
        .with_name("Corrupt Project")
        .with_color("blue")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_project(&project).unwrap();

    // Corrupt the tags column with invalid JSON
    {
        let conn = rusqlite::Connection::open(&db_path).unwrap();
        conn.execute(
            "UPDATE projects SET tags = '{not-a-valid-json}' WHERE id = 'p_corrupt'",
            [],
        )
        .unwrap();
    }

    // Act
    let result = repo.get_project("p_corrupt");

    // Assert
    assert!(
        result.is_err(),
        "get_project must fail when JSON column is corrupted"
    );

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_business_repository_patch_non_existent_project_fails_with_not_found() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_business_repo_patch_p_not_found.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = BusinessRepository::new(&db_path).unwrap();

    let project = ProjectBuilder::new()
        .with_id("missing_project")
        .with_name("Ghost Project")
        .with_color("blue")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();

    // Act
    let result = repo.patch_project(&project);

    // Assert
    assert!(result.is_err());
    match result.unwrap_err() {
        RepositoryError::NotFound { entity, id } => {
            assert_eq!(entity, "Project");
            assert_eq!(id, "missing_project");
        }
        other => panic!("expected NotFound, got {:?}", other),
    }

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_business_repository_archive_non_existent_project_fails_with_not_found() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_business_repo_archive_p_not_found.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = BusinessRepository::new(&db_path).unwrap();

    // Act
    let result = repo.archive_project("missing_project");

    // Assert
    assert!(result.is_err());
    match result.unwrap_err() {
        RepositoryError::NotFound { entity, id } => {
            assert_eq!(entity, "Project");
            assert_eq!(id, "missing_project");
        }
        other => panic!("expected NotFound, got {:?}", other),
    }

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_business_repository_patch_non_existent_task_fails_with_not_found() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_business_repo_patch_t_not_found.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = BusinessRepository::new(&db_path).unwrap();

    let task = TaskBuilder::new()
        .with_id("missing_task")
        .with_project_id("p_dummy")
        .with_name("Ghost Task")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();

    // Act
    let result = repo.patch_task(&task);

    // Assert
    assert!(result.is_err());
    match result.unwrap_err() {
        RepositoryError::NotFound { entity, id } => {
            assert_eq!(entity, "Task");
            assert_eq!(id, "missing_task");
        }
        other => panic!("expected NotFound, got {:?}", other),
    }

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_business_repository_archive_non_existent_task_fails_with_not_found() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_business_repo_archive_t_not_found.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = BusinessRepository::new(&db_path).unwrap();

    // Act
    let result = repo.archive_task("missing_task");

    // Assert
    assert!(result.is_err());
    match result.unwrap_err() {
        RepositoryError::NotFound { entity, id } => {
            assert_eq!(entity, "Task");
            assert_eq!(id, "missing_task");
        }
        other => panic!("expected NotFound, got {:?}", other),
    }

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_business_repository_corrupted_time_log_audit_history_fails() {
    // Arrange
    let conn = rusqlite::Connection::open_in_memory().unwrap();

    // Act
    let result = conn.query_row(
        "SELECT 'tl_corrupt', 't_audit', 'p_audit', '2026-06-22T10:00:00Z', '2026-06-22T11:00:00Z', 'note', '{invalid-json}'",
        [],
        BusinessRepository::map_time_log_row,
    );

    // Assert
    assert!(
        result.is_err(),
        "map_time_log_row must fail when edit_history column contains corrupted JSON"
    );
    match result.unwrap_err() {
        rusqlite::Error::FromSqlConversionFailure(col_idx, _, _) => {
            assert_eq!(col_idx, 6);
        }
        other => panic!(
            "expected FromSqlConversionFailure at column 6, got {:?}",
            other
        ),
    }
}

#[test]
fn test_business_repository_corrupted_task_edit_history_fails() {
    // Arrange
    let db_path = std::env::temp_dir().join("test_business_repo_corrupt_task_audit.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = BusinessRepository::new(&db_path).unwrap();

    let project = ProjectBuilder::new()
        .with_id("p_task_audit")
        .with_name("Task Audit Project")
        .with_color("blue")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_project(&project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_corrupt_audit")
        .with_project_id("p_task_audit")
        .with_name("Corrupt Task")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_task(&task).unwrap();

    {
        let conn = rusqlite::Connection::open(&db_path).unwrap();
        conn.execute(
            "UPDATE tasks SET edit_history = '{not-a-valid-json}' WHERE id = 't_corrupt_audit'",
            [],
        )
        .unwrap();
    }

    // Act
    let result = repo.get_task("t_corrupt_audit");

    // Assert
    assert!(
        result.is_err(),
        "get_task must fail when edit_history column is corrupted"
    );

    let _ = std::fs::remove_file(&db_path);
}
