use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_active_timer_when_start_timer_with_non_existent_task_then_active_timer_remains_active_and_error_returned(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_start_non_existent");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("proj_start_1")
        .with_name("Start Project 1")
        .with_color("blue")
        .build();
    persistence.projects.create(project).unwrap();

    let task_a = TaskBuilder::new()
        .with_id("task_start_a")
        .with_project_id("proj_start_1")
        .with_name("Task A")
        .build();
    persistence.tasks.create(task_a).unwrap();

    engine.start_timer("task_start_a").unwrap();
    let state_before = engine.get_state().unwrap();
    assert_eq!(
        state_before.active_log.as_ref().map(|l| l.task_id.as_str()),
        Some("task_start_a")
    );

    // When
    let result = engine.start_timer("task_non_existent_999");

    // Then
    assert!(result.is_err());
    let state_after = engine.get_state().unwrap();
    assert_eq!(
        state_after.active_log.as_ref().map(|l| l.task_id.as_str()),
        Some("task_start_a"),
        "Active timer must not be stopped when target task does not exist"
    );
    assert_eq!(state_after.logs.len(), 1);
    assert!(state_after.logs[0].end_time.is_none());
}

#[test]
fn test_given_active_timer_when_start_timer_with_valid_task_then_previous_closed_and_new_started_atomically(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_start_valid");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("proj_start_2")
        .with_name("Start Project 2")
        .with_color("purple")
        .build();
    persistence.projects.create(project).unwrap();

    let task_a = TaskBuilder::new()
        .with_id("task_start_2a")
        .with_project_id("proj_start_2")
        .with_name("Task 2A")
        .build();
    persistence.tasks.create(task_a).unwrap();

    let task_b = TaskBuilder::new()
        .with_id("task_start_2b")
        .with_project_id("proj_start_2")
        .with_name("Task 2B")
        .build();
    persistence.tasks.create(task_b).unwrap();

    engine.start_timer("task_start_2a").unwrap();

    // When
    let result = engine.start_timer("task_start_2b");

    // Then
    assert!(result.is_ok());
    let state = engine.get_state().unwrap();
    assert_eq!(
        state.active_log.as_ref().map(|l| l.task_id.as_str()),
        Some("task_start_2b")
    );
    assert_eq!(state.logs.len(), 2);

    let log_a = state
        .logs
        .iter()
        .find(|l| l.task_id == "task_start_2a")
        .unwrap();
    assert!(log_a.end_time.is_some());

    let log_b = state
        .logs
        .iter()
        .find(|l| l.task_id == "task_start_2b")
        .unwrap();
    assert!(log_b.end_time.is_none());
}

#[test]
fn test_given_active_timer_when_insert_fails_during_start_then_transaction_rolls_back_and_previous_timer_remains_active(
) {
    // Given
    let (conn, config, _temp_dir) = setup_persistence_test("int_start_rollback");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("proj_start_rb")
        .with_name("Start Rollback Project")
        .with_color("red")
        .build();
    persistence.projects.create(project).unwrap();

    let task_ok = TaskBuilder::new()
        .with_id("task_rb_initial")
        .with_project_id("proj_start_rb")
        .with_name("Initial Task")
        .build();
    let task_failing = TaskBuilder::new()
        .with_id("task_rb_fail")
        .with_project_id("proj_start_rb")
        .with_name("Failing Task")
        .build();
    persistence.tasks.create(task_ok).unwrap();
    persistence.tasks.create(task_failing).unwrap();

    engine.start_timer("task_rb_initial").unwrap();
    let state_before = engine.get_state().unwrap();
    assert_eq!(
        state_before.active_log.as_ref().map(|l| l.task_id.as_str()),
        Some("task_rb_initial")
    );

    // Install an SQLite trigger that fails insertion specifically for task_rb_fail
    conn.execute(
        "CREATE TRIGGER trigger_fail_insert_start BEFORE INSERT ON time_logs
         FOR EACH ROW WHEN NEW.task_id = 'task_rb_fail'
         BEGIN
             SELECT RAISE(ABORT, 'Simulated insert failure for atomic rollback verification');
         END;",
        [],
    )
    .unwrap();

    // When
    let result = engine.start_timer("task_rb_fail");

    // Then
    assert!(
        result.is_err(),
        "Engine start_timer must return an error when insert fails"
    );
    let state_after = engine.get_state().unwrap();
    assert_eq!(
        state_after.active_log.as_ref().map(|l| l.task_id.as_str()),
        Some("task_rb_initial"),
        "Previous active timer must remain active because the transaction must have rolled back"
    );
    assert_eq!(state_after.logs.len(), 1);
    assert!(
        state_after.logs[0].end_time.is_none(),
        "Previous log must not have an end_time set after rollback"
    );
}
