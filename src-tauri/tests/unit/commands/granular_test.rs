use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_granular_project_rename_updates_engine_state() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_granular_proj_rename");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    let project = ProjectBuilder::new()
        .with_id("proj_granular")
        .with_name("Initial Name")
        .with_color("teal")
        .build();
    persistence.projects.create(project).unwrap();

    // Act
    let mut proj = persistence.projects.get("proj_granular").unwrap().unwrap();
    proj.name = "Renamed Project".to_string();
    persistence.projects.patch(proj).unwrap();
    let state = engine.get_state().unwrap();

    // Assert
    assert_eq!(state.projects.len(), 1);
    assert_eq!(state.projects[0].name, "Renamed Project");
}

#[test]
fn test_granular_task_rename_updates_engine_state() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_granular_task_rename");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    let project = ProjectBuilder::new().with_id("proj_granular").build();
    persistence.projects.create(project).unwrap();
    let task = TaskBuilder::new()
        .with_id("task_parent")
        .with_project_id("proj_granular")
        .with_name("Old Parent Task")
        .build();
    persistence.tasks.create(task).unwrap();

    // Act
    let mut t = persistence.tasks.get("task_parent").unwrap().unwrap();
    t.name = "New Parent Task Name".to_string();
    persistence.tasks.patch(t).unwrap();
    let state = engine.get_state().unwrap();

    // Assert
    let updated_parent = state
        .tasks
        .iter()
        .find(|task| task.id == "task_parent")
        .unwrap();
    assert_eq!(updated_parent.name, "New Parent Task Name");
}

#[test]
fn test_query_task_project_id_and_subtasks_hierarchy() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_granular_hierarchy");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new().with_id("proj_granular").build();
    persistence.projects.create(project).unwrap();
    let parent_task = TaskBuilder::new()
        .with_id("task_parent")
        .with_project_id("proj_granular")
        .with_name("Parent Task")
        .build();
    persistence.tasks.create(parent_task).unwrap();
    let subtask = TaskBuilder::new()
        .with_id("task_sub_1")
        .with_project_id("proj_granular")
        .with_parent("task_parent")
        .with_name("Subtask 1")
        .build();
    persistence.tasks.create_subtask(subtask).unwrap();

    // Act
    let fetched_project_id = persistence
        .tasks
        .get("task_sub_1")
        .unwrap()
        .map(|task| task.project_id);
    let subtasks = persistence.tasks.get_subtasks("task_parent").unwrap();

    // Assert
    assert_eq!(fetched_project_id, Some("proj_granular".to_string()));
    assert_eq!(subtasks.len(), 1);
    assert_eq!(subtasks[0].id, "task_sub_1");
    assert_eq!(subtasks[0].name, "Subtask 1");
}
