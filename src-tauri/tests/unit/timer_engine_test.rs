use crate::shared::test_db::setup_persistence_test;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{ElapsedRangeFilter, Project, Task};

#[test]
fn test_timer_start_stop_and_switch_tasks() {
    let (_conn, config, _temp_dir) = setup_persistence_test("timer_engine_test_1");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let proj = Project {
        id: "p_eng_1".to_string(),
        name: "EngineProj".to_string(),
        color: "green".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(proj).unwrap();

    let task1 = Task {
        id: "t_eng_1".to_string(),
        project_id: "p_eng_1".to_string(),
        parent_task_id: None,
        name: "Task One".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        completed: false,
        status: None,
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    persistence.tasks.create(task1).unwrap();

    let task2 = Task {
        id: "t_eng_2".to_string(),
        project_id: "p_eng_1".to_string(),
        parent_task_id: None,
        name: "Task Two".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        completed: false,
        status: None,
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    persistence.tasks.create(task2).unwrap();

    // Start timer on task 1
    engine.start_timer("t_eng_1").unwrap();
    let active_logs = engine.get_active_logs().unwrap();
    assert_eq!(active_logs.len(), 1);
    assert_eq!(active_logs[0], "t_eng_1");

    // Starting timer on task 2 stops task 1 and starts task 2
    engine.start_timer("t_eng_2").unwrap();
    let active_logs_after_switch = engine.get_active_logs().unwrap();
    assert_eq!(active_logs_after_switch.len(), 1);
    assert_eq!(active_logs_after_switch[0], "t_eng_2");

    // Stop timer with None (stops all active)
    engine.stop_timer(None).unwrap();
    assert_eq!(engine.get_active_logs().unwrap().len(), 0);

    // Restart timer on task 1
    engine.start_timer("t_eng_1").unwrap();
    assert_eq!(
        engine.get_active_logs().unwrap(),
        vec!["t_eng_1".to_string()]
    );

    // Stop timer by project_id
    engine.stop_timer(Some("p_eng_1")).unwrap();
    assert_eq!(engine.get_active_logs().unwrap().len(), 0);

    // Test get_state
    let state = engine.get_state().unwrap();
    assert_eq!(state.projects.len(), 1);
    assert_eq!(state.tasks.len(), 2);
    assert!(state.active_log.is_none());
}

#[test]
fn test_metrics_empty_and_range_calculations() {
    let (_conn, config, _temp_dir) = setup_persistence_test("metrics_edge_cases");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    // Project statistics on empty project
    let empty_stats = engine.get_project_statistics("non_existent_proj").unwrap();
    assert_eq!(empty_stats.total_duration_sec, 0);
    assert_eq!(empty_stats.total_tasks, 0);
    assert_eq!(empty_stats.completed_tasks, 0);

    // Filter range with default filter (no logs)
    let range = engine
        .calculate_elapsed_range(&ElapsedRangeFilter::default())
        .unwrap();
    assert_eq!(range.as_secs(), 0);

    // Filter with specific task and project
    let filter_specific = ElapsedRangeFilter {
        task_id: Some("t_dummy".to_string()),
        project_id: Some("p_dummy".to_string()),
        from: Some("2025-01-01T00:00:00Z".to_string()),
        to: Some("2025-01-02T00:00:00Z".to_string()),
    };
    let range_specific = engine.calculate_elapsed_range(&filter_specific).unwrap();
    assert_eq!(range_specific.as_secs(), 0);
}
