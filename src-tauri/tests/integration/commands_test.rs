use crate::shared::test_db::setup_persistence_test;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::PersistenceLayer;
use oxy_flow::types::{Project, Task};

#[test]
fn test_commands_logic_integration_flow() {
    let (_conn, config, _temp_dir) = setup_persistence_test("commands_integration");
    let persistence = PersistenceLayer::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = Project {
        id: "proj_1".to_string(),
        name: "CommandProj".to_string(),
        color: "purple".to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
    };
    persistence.projects.create_project(project).expect("add_project failed");
    let state_after_proj = engine.get_state().unwrap();
    assert_eq!(state_after_proj.projects.len(), 1);
    assert_eq!(state_after_proj.projects[0].name, "CommandProj");
    let project_id = &state_after_proj.projects[0].id;

    let task = Task {
        id: "task_1".to_string(),
        project_id: project_id.clone(),
        parent_task_id: None,
        name: "CommandTask".to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
        completed: false,
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    persistence.tasks.create_task(task).expect("add_task failed");
    let state_after_task = engine.get_state().unwrap();
    assert_eq!(state_after_task.tasks.len(), 1);
    assert_eq!(state_after_task.tasks[0].name, "CommandTask");
    let task_id = &state_after_task.tasks[0].id;

    engine.start_timer(task_id).expect("start_timer failed");
    let current_state = engine.get_state().expect("get_timer_state failed");
    assert!(current_state.active_log.is_some());
    assert_eq!(current_state.active_log.unwrap().task_id, task_id.clone());

    engine.stop_timer(None).expect("stop_timer failed");
    let state_after_stop = engine.get_state().unwrap();
    assert!(state_after_stop.active_log.is_none());

    let mut task = persistence.tasks.get_task(&task_id).unwrap().unwrap();
    task.completed = !task.completed;
    persistence.tasks.patch_task(task).expect("toggle_task_complete failed");
    let state_after_complete = engine.get_state().unwrap();
    assert!(state_after_complete.tasks[0].completed);
}
