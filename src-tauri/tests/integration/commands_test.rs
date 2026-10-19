use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::TaskStatus;

#[test]
fn test_given_persistence_and_engine_when_project_and_task_created_then_engine_state_reflects_hierarchy(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_commands_hierarchy");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    let project = ProjectBuilder::new()
        .with_id("proj_1")
        .with_name("CommandProj")
        .with_color("purple")
        .build();
    let task = TaskBuilder::new()
        .with_id("task_1")
        .with_project_id("proj_1")
        .with_name("CommandTask")
        .with_status(TaskStatus::Todo)
        .build();

    // When
    persistence
        .projects
        .create(project)
        .expect("add_project failed");
    persistence.tasks.create(task).expect("add_task failed");

    // Then
    let state = engine.get_state().unwrap();
    assert_eq!(state.projects.len(), 1);
    assert_eq!(state.projects[0].name, "CommandProj");
    assert_eq!(state.tasks.len(), 1);
    assert_eq!(state.tasks[0].name, "CommandTask");
}

#[test]
fn test_given_persisted_task_when_timer_lifecycle_executed_then_engine_state_tracks_and_clears_active_log(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_commands_timer_lifecycle");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    let project = ProjectBuilder::new().with_id("proj_2").build();
    let task = TaskBuilder::new()
        .with_id("task_2")
        .with_project_id("proj_2")
        .build();
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();

    // When
    engine.start_timer("task_2").expect("start_timer failed");
    let state_running = engine.get_state().expect("get_state failed");
    let active_log = state_running.active_log;

    engine.stop_timer(None).expect("stop_timer failed");
    let state_stopped = engine.get_state().expect("get_state failed");

    // Then
    assert!(active_log.is_some());
    assert_eq!(active_log.unwrap().task_id, "task_2");
    assert!(state_stopped.active_log.is_none());
}

#[test]
fn test_given_task_when_marked_complete_then_engine_state_reflects_updated_completion() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_commands_task_complete");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    let project = ProjectBuilder::new().with_id("proj_3").build();
    let task = TaskBuilder::new()
        .with_id("task_3")
        .with_project_id("proj_3")
        .completed(false)
        .build();
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();

    // When
    let mut loaded_task = persistence.tasks.get("task_3").unwrap().unwrap();
    loaded_task.completed = true;
    persistence.tasks.patch(loaded_task).unwrap();

    // Then
    let state = engine.get_state().unwrap();
    assert!(state.tasks[0].completed);
}
