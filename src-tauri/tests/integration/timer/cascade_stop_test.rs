use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::commands::persistence::project::toggle_project_archive;
use oxy_flow::commands::persistence::task::delete_task;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_active_timer_on_project_task_when_project_archived_then_stops_timer_and_commits_log()
{
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_cascade_proj_archive");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_cascade")
        .with_name("Cascade Project")
        .with_color("blue")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_cascade")
        .with_project_id("p_cascade")
        .with_name("Cascade Task")
        .build();
    persistence.tasks.create(task).unwrap();

    engine.start_timer("t_cascade").unwrap();
    let initial_state = engine.get_state().unwrap();
    assert!(initial_state.active_log.is_some());
    assert_eq!(
        initial_state.active_log.as_ref().unwrap().task_id,
        "t_cascade"
    );

    // When
    let state_after_archive = toggle_project_archive(&persistence, "p_cascade").unwrap();

    // Then
    assert!(state_after_archive.active_log.is_none());
    assert_eq!(state_after_archive.projects[0].archived, Some(true));
    assert_eq!(state_after_archive.logs.len(), 1);
    assert!(state_after_archive.logs[0].end_time.is_some());
}

#[test]
fn test_given_active_timer_on_task_when_task_deleted_then_stops_timer_and_commits_log() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_cascade_task_delete");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_task_del")
        .with_name("Task Delete Project")
        .with_color("green")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_task_del")
        .with_project_id("p_task_del")
        .with_name("Task To Delete")
        .build();
    persistence.tasks.create(task).unwrap();

    engine.start_timer("t_task_del").unwrap();
    assert!(engine.get_state().unwrap().active_log.is_some());

    // When
    let state_after_delete = delete_task(&persistence, "t_task_del").unwrap();

    // Then
    assert!(state_after_delete.active_log.is_none());
    assert_eq!(state_after_delete.logs.len(), 1);
    assert!(state_after_delete.logs[0].end_time.is_some());
}

#[test]
fn test_given_active_timer_on_subtask_when_parent_task_deleted_then_stops_timer_and_commits_log() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_cascade_subtask_delete");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_sub")
        .with_name("Subtask Project")
        .with_color("indigo")
        .build();
    persistence.projects.create(project).unwrap();

    let parent_task = TaskBuilder::new()
        .with_id("t_parent")
        .with_project_id("p_sub")
        .with_name("Parent Task")
        .build();
    persistence.tasks.create(parent_task).unwrap();

    let child_task = TaskBuilder::new()
        .with_id("t_child")
        .with_project_id("p_sub")
        .with_parent("t_parent")
        .with_name("Child Subtask")
        .build();
    persistence.tasks.create_subtask(child_task).unwrap();

    engine.start_timer("t_child").unwrap();
    let initial_state = engine.get_state().unwrap();
    assert_eq!(
        initial_state.active_log.as_ref().unwrap().task_id,
        "t_child"
    );

    // When
    let state_after_delete = delete_task(&persistence, "t_parent").unwrap();

    // Then
    assert!(state_after_delete.active_log.is_none());
    assert_eq!(state_after_delete.logs.len(), 1);
    assert!(state_after_delete.logs[0].end_time.is_some());
}

#[test]
fn test_given_active_timer_on_task_when_unrelated_task_deleted_then_timer_remains_active() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_cascade_unrelated_delete");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_unrelated")
        .with_name("Unrelated Project")
        .with_color("purple")
        .build();
    persistence.projects.create(project).unwrap();

    let active_task = TaskBuilder::new()
        .with_id("t_active")
        .with_project_id("p_unrelated")
        .with_name("Active Task")
        .build();
    let other_task = TaskBuilder::new()
        .with_id("t_other")
        .with_project_id("p_unrelated")
        .with_name("Other Task")
        .build();
    persistence.tasks.create(active_task).unwrap();
    persistence.tasks.create(other_task).unwrap();

    engine.start_timer("t_active").unwrap();
    assert!(engine.get_state().unwrap().active_log.is_some());

    // When
    let state_after_delete = delete_task(&persistence, "t_other").unwrap();

    // Then
    assert!(state_after_delete.active_log.is_some());
    assert_eq!(
        state_after_delete.active_log.as_ref().unwrap().task_id,
        "t_active"
    );
}
