use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_active_timer_when_switch_to_non_existent_task_then_active_timer_remains_active_and_error_returned(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_switch_non_existent");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("proj_switch_1")
        .with_name("Switch Project 1")
        .with_color("blue")
        .build();
    persistence.projects.create(project).unwrap();

    let task_a = TaskBuilder::new()
        .with_id("task_switch_a")
        .with_project_id("proj_switch_1")
        .with_name("Task A")
        .build();
    persistence.tasks.create(task_a).unwrap();

    engine.start_timer("task_switch_a").unwrap();
    let state_before = engine.get_state().unwrap();
    assert_eq!(
        state_before.active_log.as_ref().map(|l| l.task_id.as_str()),
        Some("task_switch_a")
    );

    // When
    let result = engine.switch_timer("task_non_existent_999");

    // Then
    assert!(result.is_err());
    let state_after = engine.get_state().unwrap();
    assert_eq!(
        state_after.active_log.as_ref().map(|l| l.task_id.as_str()),
        Some("task_switch_a"),
        "Active timer must not be stopped when target task does not exist"
    );
    assert_eq!(state_after.logs.len(), 1);
    assert!(state_after.logs[0].end_time.is_none());
}

#[test]
fn test_given_active_timer_when_switch_to_valid_target_task_then_previous_log_closed_and_new_log_started_atomically(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_switch_valid");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("proj_switch_2")
        .with_name("Switch Project 2")
        .with_color("purple")
        .build();
    persistence.projects.create(project).unwrap();

    let task_a = TaskBuilder::new()
        .with_id("task_switch_2a")
        .with_project_id("proj_switch_2")
        .with_name("Task 2A")
        .build();
    persistence.tasks.create(task_a).unwrap();

    let task_b = TaskBuilder::new()
        .with_id("task_switch_2b")
        .with_project_id("proj_switch_2")
        .with_name("Task 2B")
        .build();
    persistence.tasks.create(task_b).unwrap();

    engine.start_timer("task_switch_2a").unwrap();

    // When
    let result = engine.switch_timer("task_switch_2b");

    // Then
    assert!(result.is_ok());
    let state = engine.get_state().unwrap();
    assert_eq!(
        state.active_log.as_ref().map(|l| l.task_id.as_str()),
        Some("task_switch_2b")
    );
    assert_eq!(state.logs.len(), 2);

    let log_a = state
        .logs
        .iter()
        .find(|l| l.task_id == "task_switch_2a")
        .unwrap();
    assert!(log_a.end_time.is_some());

    let log_b = state
        .logs
        .iter()
        .find(|l| l.task_id == "task_switch_2b")
        .unwrap();
    assert!(log_b.end_time.is_none());
}
