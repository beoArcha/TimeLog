use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use oxy_flow::repositories::business::BusinessRepository;

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
