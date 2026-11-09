use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxyflow_timelog::commands::persistence::project::toggle_project_archive;
use oxyflow_timelog::commands::persistence::task::{
    collect_task_and_descendant_ids, delete_task, toggle_task_completion, update_task_details,
    TaskUpdateInput,
};
use oxyflow_timelog::common::AppError;
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::{Persistence, PersistenceError};
use oxyflow_timelog::types::{TaskStatus, TriState};

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

#[test]
fn test_given_active_timer_on_subtask_when_parent_task_completed_via_toggle_then_stops_timer_and_commits_log(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_cascade_subtask_toggle_complete");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_toggle")
        .with_name("Toggle Project")
        .with_color("blue")
        .build();
    persistence.projects.create(project).unwrap();

    let parent_task = TaskBuilder::new()
        .with_id("t_parent_toggle")
        .with_project_id("p_toggle")
        .with_name("Parent Task")
        .build();
    persistence.tasks.create(parent_task).unwrap();

    let child_task = TaskBuilder::new()
        .with_id("t_child_toggle")
        .with_project_id("p_toggle")
        .with_parent("t_parent_toggle")
        .with_name("Child Subtask")
        .build();
    persistence.tasks.create_subtask(child_task).unwrap();

    engine.start_timer("t_child_toggle").unwrap();
    assert_eq!(
        engine
            .get_state()
            .unwrap()
            .active_log
            .as_ref()
            .unwrap()
            .task_id,
        "t_child_toggle"
    );

    // When
    let state_after_toggle = toggle_task_completion(&persistence, "t_parent_toggle").unwrap();

    // Then
    assert!(state_after_toggle.active_log.is_none());
    assert_eq!(state_after_toggle.logs.len(), 1);
    assert!(state_after_toggle.logs[0].end_time.is_some());
}

#[test]
fn test_given_active_timer_on_subtask_when_parent_task_completed_via_update_then_stops_timer_and_commits_log(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_cascade_subtask_update_complete");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_update")
        .with_name("Update Project")
        .with_color("red")
        .build();
    persistence.projects.create(project).unwrap();

    let parent_task = TaskBuilder::new()
        .with_id("t_parent_update")
        .with_project_id("p_update")
        .with_name("Parent Task")
        .build();
    persistence.tasks.create(parent_task).unwrap();

    let child_task = TaskBuilder::new()
        .with_id("t_child_update")
        .with_project_id("p_update")
        .with_parent("t_parent_update")
        .with_name("Child Subtask")
        .build();
    persistence.tasks.create_subtask(child_task).unwrap();

    engine.start_timer("t_child_update").unwrap();
    assert_eq!(
        engine
            .get_state()
            .unwrap()
            .active_log
            .as_ref()
            .unwrap()
            .task_id,
        "t_child_update"
    );

    // When
    let state_after_update = update_task_details(
        &persistence,
        "t_parent_update",
        TaskUpdateInput {
            name: "Parent Task".to_string(),
            parent_task_id: None,
            status: Some(TaskStatus::Done),
            completed: Some(true),
            hourly_rate: TriState::Absent,
        },
    )
    .unwrap();

    // Then
    assert!(state_after_update.active_log.is_none());
    assert_eq!(state_after_update.logs.len(), 1);
    assert!(state_after_update.logs[0].end_time.is_some());
}

#[test]
fn test_given_active_timer_on_grandchild_task_when_grandparent_completed_then_stops_timer_and_commits_log(
) {
    // 1. Aktywny timer wnuka; ukończenie dziadka zamyka właściwy log.
    let (_conn, config, _temp_dir) = setup_persistence_test("int_cascade_grandchild_stop");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_grand")
        .with_name("Grandparent Project")
        .with_color("blue")
        .build();
    persistence.projects.create(project).unwrap();

    let grandparent = TaskBuilder::new()
        .with_id("t_grandparent")
        .with_project_id("p_grand")
        .with_name("Grandparent Task")
        .build();
    persistence.tasks.create(grandparent).unwrap();

    let parent = TaskBuilder::new()
        .with_id("t_parent_mid")
        .with_project_id("p_grand")
        .with_parent("t_grandparent")
        .with_name("Parent Task Mid")
        .build();
    persistence.tasks.create_subtask(parent).unwrap();

    let grandchild = TaskBuilder::new()
        .with_id("t_grandchild")
        .with_project_id("p_grand")
        .with_parent("t_parent_mid")
        .with_name("Grandchild Task")
        .build();
    persistence.tasks.create_subtask(grandchild).unwrap();

    engine.start_timer("t_grandchild").unwrap();
    assert_eq!(
        engine
            .get_state()
            .unwrap()
            .active_log
            .as_ref()
            .unwrap()
            .task_id,
        "t_grandchild"
    );

    let state_after_toggle = toggle_task_completion(&persistence, "t_grandparent").unwrap();

    assert!(state_after_toggle.active_log.is_none());
    assert_eq!(state_after_toggle.logs.len(), 1);
    assert_eq!(state_after_toggle.logs[0].task_id, "t_grandchild");
    assert!(state_after_toggle.logs[0].end_time.is_some());
}

#[test]
fn test_given_two_active_logs_in_different_projects_when_one_task_completed_then_only_matching_log_closed(
) {
    // 2. Dwa aktywne logi w różnych projektach; ukończenie jednego zadania zamyka tylko jego log.
    let (_conn, config, _temp_dir) = setup_persistence_test("int_cascade_diff_projects");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let mut project1 = ProjectBuilder::new()
        .with_id("p_diff_1")
        .with_name("Project 1")
        .with_color("blue")
        .build();
    project1.allow_concurrency = Some(true);
    persistence.projects.create(project1).unwrap();

    let mut project2 = ProjectBuilder::new()
        .with_id("p_diff_2")
        .with_name("Project 2")
        .with_color("green")
        .build();
    project2.allow_concurrency = Some(true);
    persistence.projects.create(project2).unwrap();

    let task1 = TaskBuilder::new()
        .with_id("t_diff_1")
        .with_project_id("p_diff_1")
        .with_name("Task 1")
        .build();
    let task2 = TaskBuilder::new()
        .with_id("t_diff_2")
        .with_project_id("p_diff_2")
        .with_name("Task 2")
        .build();
    persistence.tasks.create(task1).unwrap();
    persistence.tasks.create(task2).unwrap();

    let now = chrono::Utc::now().to_rfc3339();
    persistence
        .time_logs
        .insert("log_diff_1", "t_diff_1", &now)
        .unwrap();
    persistence
        .time_logs
        .insert("log_diff_2", "t_diff_2", &now)
        .unwrap();

    let state_before = engine.get_state().unwrap();
    assert_eq!(state_before.active_logs.as_ref().unwrap().len(), 2);

    let state_after = toggle_task_completion(&persistence, "t_diff_1").unwrap();

    let remaining_active = state_after.active_logs.unwrap();
    assert_eq!(remaining_active.len(), 1);
    assert_eq!(remaining_active[0].task_id, "t_diff_2");

    let log1 = state_after
        .logs
        .iter()
        .find(|l| l.id == "log_diff_1")
        .unwrap();
    let log2 = state_after
        .logs
        .iter()
        .find(|l| l.id == "log_diff_2")
        .unwrap();
    assert!(log1.end_time.is_some());
    assert!(log2.end_time.is_none());
}

#[test]
fn test_given_two_active_logs_in_same_project_with_concurrency_when_one_task_completed_then_other_log_remains_active(
) {
    // 3. Dwa aktywne logi w jednym projekcie przy współbieżności; ukończenie jednego zadania nie zamyka drugiego.
    let (_conn, config, _temp_dir) = setup_persistence_test("int_cascade_same_proj_concurrency");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let mut project = ProjectBuilder::new()
        .with_id("p_same_conc")
        .with_name("Same Proj Concurrency")
        .with_color("purple")
        .build();
    project.allow_concurrency = Some(true);
    persistence.projects.create(project).unwrap();

    let task1 = TaskBuilder::new()
        .with_id("t_conc_1")
        .with_project_id("p_same_conc")
        .with_name("Concurrent Task 1")
        .build();
    let task2 = TaskBuilder::new()
        .with_id("t_conc_2")
        .with_project_id("p_same_conc")
        .with_name("Concurrent Task 2")
        .build();
    persistence.tasks.create(task1).unwrap();
    persistence.tasks.create(task2).unwrap();

    let now = chrono::Utc::now().to_rfc3339();
    persistence
        .time_logs
        .insert("log_same_1", "t_conc_1", &now)
        .unwrap();
    persistence
        .time_logs
        .insert("log_same_2", "t_conc_2", &now)
        .unwrap();

    let state_before = engine.get_state().unwrap();
    assert_eq!(state_before.active_logs.as_ref().unwrap().len(), 2);

    let state_after = toggle_task_completion(&persistence, "t_conc_1").unwrap();

    let remaining_active = state_after.active_logs.unwrap();
    assert_eq!(remaining_active.len(), 1);
    assert_eq!(remaining_active[0].task_id, "t_conc_2");

    let log1 = state_after
        .logs
        .iter()
        .find(|l| l.id == "log_same_1")
        .unwrap();
    let log2 = state_after
        .logs
        .iter()
        .find(|l| l.id == "log_same_2")
        .unwrap();
    assert!(log1.end_time.is_some());
    assert!(log2.end_time.is_none());
}

#[test]
fn test_given_no_active_timer_for_task_when_completed_then_succeeds_without_error() {
    // 4. Brak aktywnego timera dla zadania nie powoduje błędu.
    let (_conn, config, _temp_dir) = setup_persistence_test("int_cascade_no_active_timer");
    let persistence = Persistence::new(&config).unwrap();

    let project = ProjectBuilder::new()
        .with_id("p_no_active")
        .with_name("No Active Timer Project")
        .with_color("yellow")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_no_active")
        .with_project_id("p_no_active")
        .with_name("No Active Task")
        .build();
    persistence.tasks.create(task).unwrap();

    let toggle_result = toggle_task_completion(&persistence, "t_no_active");
    assert!(toggle_result.is_ok());
    let state_toggle = toggle_result.unwrap();
    assert!(state_toggle.active_log.is_none());

    let update_result = update_task_details(
        &persistence,
        "t_no_active",
        TaskUpdateInput {
            name: "No Active Task Renamed".to_string(),
            parent_task_id: None,
            status: Some(TaskStatus::Done),
            completed: Some(true),
            hourly_rate: TriState::Absent,
        },
    );
    assert!(update_result.is_ok());
}

#[test]
fn test_given_descendant_fetch_error_when_completing_task_then_error_is_propagated() {
    // 5. Błąd pobierania potomków jest propagowany.
    let (conn, config, _temp_dir) = setup_persistence_test("int_cascade_descendant_err");
    let persistence = Persistence::new(&config).unwrap();

    let project = ProjectBuilder::new()
        .with_id("p_desc_err")
        .with_name("Descendant Error Project")
        .with_color("red")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_desc_err")
        .with_project_id("p_desc_err")
        .with_name("Root Task")
        .build();
    persistence.tasks.create(task).unwrap();

    conn.execute("DROP TABLE tasks", []).unwrap();

    let collect_res = collect_task_and_descendant_ids(&persistence, "t_desc_err");
    assert!(collect_res.is_err());
    let err = collect_res.unwrap_err();
    assert!(matches!(err, PersistenceError::Database(_)));

    let toggle_res = toggle_task_completion(&persistence, "t_desc_err");
    assert!(matches!(
        toggle_res,
        Err(AppError::Persistence(PersistenceError::Database(_)))
    ));
}
