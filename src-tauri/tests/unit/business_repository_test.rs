use oxy_flow::repositories::business::BusinessRepository;
use oxy_flow::types::{Project, Task};

#[test]
fn test_business_repository_crud() {
    let db_path = std::env::temp_dir().join("test_business_repo.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }

    let repo = BusinessRepository::new(&db_path).unwrap();

    let project = Project {
        id: "p1".to_string(),
        name: "Project 1".to_string(),
        color: "red".to_string(),
        created_at: "2026-06-22T20:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
    };
    repo.create_project(&project).unwrap();

    let p_saved = repo.get_project("p1").unwrap().unwrap();
    assert_eq!(p_saved.name, "Project 1");
    assert_eq!(p_saved.archived, Some(false));

    let mut p_patched = p_saved.clone();
    p_patched.name = "Project 1 Patched".to_string();
    repo.patch_project(&p_patched).unwrap();
    let p_saved2 = repo.get_project("p1").unwrap().unwrap();
    assert_eq!(p_saved2.name, "Project 1 Patched");

    let task = Task {
        id: "t1".to_string(),
        project_id: "p1".to_string(),
        parent_task_id: None,
        name: "Task 1".to_string(),
        completed: false,
        created_at: "2026-06-22T20:00:00Z".to_string(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    repo.create_task(&task).unwrap();

    let t_saved = repo.get_task("t1").unwrap().unwrap();
    assert_eq!(t_saved.name, "Task 1");

    let tasks = repo.get_tasks_for_project("p1").unwrap();
    assert_eq!(tasks.len(), 1);
    assert_eq!(tasks[0].id, "t1");

    let subtask = Task {
        id: "st1".to_string(),
        project_id: "p1".to_string(),
        parent_task_id: Some("t1".to_string()),
        name: "Subtask 1".to_string(),
        completed: false,
        created_at: "2026-06-22T20:00:00Z".to_string(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    repo.create_subtask(&subtask).unwrap();

    let st_saved = repo.get_task("st1").unwrap().unwrap();
    assert_eq!(st_saved.parent_task_id, Some("t1".to_string()));

    let subtasks = repo.get_subtasks_for_task("t1").unwrap();
    assert_eq!(subtasks.len(), 1);
    assert_eq!(subtasks[0].id, "st1");

    repo.archive_project("p1").unwrap();
    let p_archived = repo.get_project("p1").unwrap().unwrap();
    assert_eq!(p_archived.archived, Some(true));

    let _ = std::fs::remove_file(&db_path);
}
