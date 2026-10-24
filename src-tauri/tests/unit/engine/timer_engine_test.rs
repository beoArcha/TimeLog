use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::ElapsedRangeFilter;

#[test]
fn test_timer_start_activates_log_for_task() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("timer_start_task");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p_eng_1")
        .with_name("EngineProj")
        .with_color("green")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();
    persistence.projects.create(proj).unwrap();

    let task1 = TaskBuilder::new()
        .with_id("t_eng_1")
        .with_project_id("p_eng_1")
        .with_name("Task One")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();
    persistence.tasks.create(task1).unwrap();

    // Act
    engine.start_timer("t_eng_1").unwrap();

    // Assert
    let active_logs = engine.get_active_logs().unwrap();
    assert_eq!(active_logs.len(), 1);
    assert_eq!(active_logs[0], "t_eng_1");
}

#[test]
fn test_timer_start_on_second_task_stops_previous_task() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("timer_switch_tasks");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p_eng_1")
        .with_name("EngineProj")
        .with_color("green")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();
    persistence.projects.create(proj).unwrap();

    let task1 = TaskBuilder::new()
        .with_id("t_eng_1")
        .with_project_id("p_eng_1")
        .with_name("Task One")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();
    persistence.tasks.create(task1).unwrap();

    let task2 = TaskBuilder::new()
        .with_id("t_eng_2")
        .with_project_id("p_eng_1")
        .with_name("Task Two")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();
    persistence.tasks.create(task2).unwrap();

    engine.start_timer("t_eng_1").unwrap();

    // Act
    engine.start_timer("t_eng_2").unwrap();

    // Assert
    let active_logs = engine.get_active_logs().unwrap();
    assert_eq!(active_logs.len(), 1);
    assert_eq!(active_logs[0], "t_eng_2");
}

#[test]
fn test_timer_stop_without_filter_stops_all_active_logs() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("timer_stop_all");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p_eng_1")
        .with_name("EngineProj")
        .with_color("green")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();
    persistence.projects.create(proj).unwrap();

    let task1 = TaskBuilder::new()
        .with_id("t_eng_1")
        .with_project_id("p_eng_1")
        .with_name("Task One")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();
    persistence.tasks.create(task1).unwrap();
    engine.start_timer("t_eng_1").unwrap();

    // Act
    engine.stop_timer(None).unwrap();

    // Assert
    let active_logs = engine.get_active_logs().unwrap();
    assert!(active_logs.is_empty());
}

#[test]
fn test_timer_stop_by_project_id_stops_active_logs_in_project() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("timer_stop_proj");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p_eng_1")
        .with_name("EngineProj")
        .with_color("green")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();
    persistence.projects.create(proj).unwrap();

    let task1 = TaskBuilder::new()
        .with_id("t_eng_1")
        .with_project_id("p_eng_1")
        .with_name("Task One")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();
    persistence.tasks.create(task1).unwrap();
    engine.start_timer("t_eng_1").unwrap();

    // Act
    engine.stop_timer(Some("p_eng_1")).unwrap();

    // Assert
    let active_logs = engine.get_active_logs().unwrap();
    assert!(active_logs.is_empty());
}

#[test]
fn test_get_state_returns_snapshot_of_projects_and_tasks() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("timer_get_state");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p_eng_1")
        .with_name("EngineProj")
        .with_color("green")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();
    persistence.projects.create(proj).unwrap();

    let task1 = TaskBuilder::new()
        .with_id("t_eng_1")
        .with_project_id("p_eng_1")
        .with_name("Task One")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();
    persistence.tasks.create(task1).unwrap();

    let task2 = TaskBuilder::new()
        .with_id("t_eng_2")
        .with_project_id("p_eng_1")
        .with_name("Task Two")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();
    persistence.tasks.create(task2).unwrap();

    // Act
    let state = engine.get_state().unwrap();

    // Assert
    assert_eq!(state.projects.len(), 1);
    assert_eq!(state.tasks.len(), 2);
    assert!(state.active_log.is_none());
}

#[test]
fn test_get_project_statistics_on_non_existent_project_returns_zeros() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("timer_stats_empty");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    // Act
    let empty_stats = engine.get_project_statistics("non_existent_proj").unwrap();

    // Assert
    assert_eq!(empty_stats.total_duration_sec, 0);
    assert_eq!(empty_stats.total_tasks, 0);
    assert_eq!(empty_stats.completed_tasks, 0);
}

#[test]
fn test_calculate_elapsed_range_with_no_logs_returns_zero() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("timer_range_zero");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let filter_specific = ElapsedRangeFilter {
        task_id: Some("t_dummy".to_string()),
        project_id: Some("p_dummy".to_string()),
        from: Some("2025-01-01T00:00:00Z".to_string()),
        to: Some("2025-01-02T00:00:00Z".to_string()),
        include_patches: None,
    };

    // Act
    let range_default = engine
        .calculate_elapsed_range(&ElapsedRangeFilter::default())
        .unwrap();
    let range_specific = engine.calculate_elapsed_range(&filter_specific).unwrap();

    // Assert
    assert_eq!(range_default.as_secs(), 0);
    assert_eq!(range_specific.as_secs(), 0);
}

#[test]
fn test_timer_concurrency_stops_non_concurrent_project_when_starting_another_non_concurrent() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("timer_concurrency_stop_other");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let proj1 = ProjectBuilder::new()
        .with_id("p_conc_1")
        .with_name("Proj1")
        .with_color("blue")
        .with_allow_concurrency(false)
        .build();
    let proj2 = ProjectBuilder::new()
        .with_id("p_conc_2")
        .with_name("Proj2")
        .with_color("red")
        .with_allow_concurrency(false)
        .build();
    persistence.projects.create(proj1).unwrap();
    persistence.projects.create(proj2).unwrap();

    let task1 = TaskBuilder::new()
        .with_id("t_conc_1")
        .with_project_id("p_conc_1")
        .with_name("Task 1")
        .build();
    let task2 = TaskBuilder::new()
        .with_id("t_conc_2")
        .with_project_id("p_conc_2")
        .with_name("Task 2")
        .build();
    persistence.tasks.create(task1).unwrap();
    persistence.tasks.create(task2).unwrap();

    // Act
    engine.start_timer("t_conc_1").unwrap();
    assert_eq!(engine.get_active_logs().unwrap(), vec!["t_conc_1"]);

    engine.start_timer("t_conc_2").unwrap();

    // Assert
    let active_logs = engine.get_active_logs().unwrap();
    assert_eq!(active_logs, vec!["t_conc_2"]);
}

#[test]
fn test_timer_concurrency_keeps_running_when_allow_concurrency_is_true() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("timer_concurrency_allow_concurrent");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let proj_concurrent = ProjectBuilder::new()
        .with_id("p_conc_true")
        .with_name("Concurrent Proj")
        .with_color("green")
        .with_allow_concurrency(true)
        .build();
    let proj_single_1 = ProjectBuilder::new()
        .with_id("p_single_1")
        .with_name("Single 1")
        .with_color("purple")
        .with_allow_concurrency(false)
        .build();
    let proj_single_2 = ProjectBuilder::new()
        .with_id("p_single_2")
        .with_name("Single 2")
        .with_color("orange")
        .with_allow_concurrency(false)
        .build();
    persistence.projects.create(proj_concurrent).unwrap();
    persistence.projects.create(proj_single_1).unwrap();
    persistence.projects.create(proj_single_2).unwrap();

    let task_conc = TaskBuilder::new()
        .with_id("t_conc")
        .with_project_id("p_conc_true")
        .with_name("Concurrent Task")
        .build();
    let task_single_1 = TaskBuilder::new()
        .with_id("t_single_1")
        .with_project_id("p_single_1")
        .with_name("Single Task 1")
        .build();
    let task_single_2 = TaskBuilder::new()
        .with_id("t_single_2")
        .with_project_id("p_single_2")
        .with_name("Single Task 2")
        .build();
    persistence.tasks.create(task_conc).unwrap();
    persistence.tasks.create(task_single_1).unwrap();
    persistence.tasks.create(task_single_2).unwrap();

    // Act & Assert
    // 1. Start concurrent project timer
    engine.start_timer("t_conc").unwrap();
    assert_eq!(engine.get_active_logs().unwrap(), vec!["t_conc"]);

    // 2. Start single project 1 timer - concurrent project should keep running!
    engine.start_timer("t_single_1").unwrap();
    let mut active = engine.get_active_logs().unwrap();
    active.sort();
    assert_eq!(active, vec!["t_conc", "t_single_1"]);

    // 3. Start single project 2 timer - single project 1 should stop, but concurrent stays running!
    engine.start_timer("t_single_2").unwrap();
    let mut active_after = engine.get_active_logs().unwrap();
    active_after.sort();
    assert_eq!(active_after, vec!["t_conc", "t_single_2"]);
}
