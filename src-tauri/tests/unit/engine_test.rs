use crate::shared::test_db::setup_persistence_test;
use chrono::{Duration as ChronoDuration, Utc};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{Project, Task};

#[test]
fn test_engine_elapsed_time_calculations() {
    let (conn, config, _temp_dir) = setup_persistence_test("engine_elapsed");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = Project {
        id: "p1".to_string(),
        name: "EngineProj".to_string(),
        color: "green".to_string(),
        created_at: Utc::now().to_rfc3339(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(project).unwrap();

    let task = Task {
        id: "t1".to_string(),
        project_id: "p1".to_string(),
        parent_task_id: None,
        name: "ParentTask".to_string(),
        completed: false,
        created_at: Utc::now().to_rfc3339(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
    persistence.tasks.create(task).unwrap();

    let subtask = Task {
        id: "t1-sub".to_string(),
        project_id: "p1".to_string(),
        parent_task_id: Some("t1".to_string()),
        name: "Subtask".to_string(),
        completed: false,
        created_at: Utc::now().to_rfc3339(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
    persistence.tasks.create_subtask(subtask).unwrap();

    let now = Utc::now();
    let start_10m_ago = (now - ChronoDuration::minutes(10)).to_rfc3339();
    let end_5m_ago = (now - ChronoDuration::minutes(5)).to_rfc3339();

    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        ["l1", "t1", &start_10m_ago, &end_5m_ago],
    )
    .unwrap();

    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, NULL)",
        ["l2", "t1-sub", &start_10m_ago],
    )
    .unwrap();

    let subtask_elapsed = engine.calculate_subtask_elapsed("t1-sub").unwrap();
    assert!(
        subtask_elapsed.as_secs() >= 598 && subtask_elapsed.as_secs() <= 602,
        "subtask elapsed: {:?}",
        subtask_elapsed
    );

    let task_elapsed = engine.calculate_task_elapsed("t1").unwrap();
    assert!(
        task_elapsed.as_secs() >= 898 && task_elapsed.as_secs() <= 902,
        "task elapsed: {:?}",
        task_elapsed
    );

    let proj_elapsed = engine.calculate_project_elapsed("p1").unwrap();
    assert!(
        proj_elapsed.as_secs() >= 898 && proj_elapsed.as_secs() <= 902,
        "project elapsed: {:?}",
        proj_elapsed
    );
}

#[test]
fn test_project_statistics() {
    let (_conn, config, _temp_dir) = setup_persistence_test("engine_stats");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = Project {
        id: "p_stats".to_string(),
        name: "StatsProj".to_string(),
        color: "blue".to_string(),
        created_at: Utc::now().to_rfc3339(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(project).unwrap();

    let task1 = Task {
        id: "t_stats1".to_string(),
        project_id: "p_stats".to_string(),
        parent_task_id: None,
        name: "Task 1".to_string(),
        completed: true,
        created_at: Utc::now().to_rfc3339(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Done),
    };
    persistence.tasks.create(task1).unwrap();

    let task2 = Task {
        id: "t_stats2".to_string(),
        project_id: "p_stats".to_string(),
        parent_task_id: None,
        name: "Task 2".to_string(),
        completed: false,
        created_at: Utc::now().to_rfc3339(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
    persistence.tasks.create(task2).unwrap();

    let stats = engine.get_project_statistics("p_stats").unwrap();
    assert_eq!(stats.total_tasks, 2);
    assert_eq!(stats.completed_tasks, 1);
}

#[test]
fn test_task_hierarchy_validation() {
    let (_conn, config, _temp_dir) = setup_persistence_test("engine_hierarchy");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = Project {
        id: "p_h".to_string(),
        name: "HierarchyProj".to_string(),
        color: "red".to_string(),
        created_at: Utc::now().to_rfc3339(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(project).unwrap();

    let task1 = Task {
        id: "t_h1".to_string(),
        project_id: "p_h".to_string(),
        parent_task_id: None,
        name: "Parent".to_string(),
        completed: false,
        created_at: Utc::now().to_rfc3339(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
    persistence.tasks.create(task1).unwrap();

    // 1. Same task as parent
    assert!(engine
        .validate_task_hierarchy(Some("t_h1"), Some("t_h1"))
        .is_err());

    // 2. Add valid subtask
    let task2 = Task {
        id: "t_h2".to_string(),
        project_id: "p_h".to_string(),
        parent_task_id: Some("t_h1".to_string()),
        name: "Subtask".to_string(),
        completed: false,
        created_at: Utc::now().to_rfc3339(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
    persistence.tasks.create_subtask(task2).unwrap();

    // 3. Try to add subtask to a subtask (invalid, depth > 1)
    assert!(engine.validate_task_hierarchy(None, Some("t_h2")).is_err());
}

#[test]
fn test_engine_elapsed_range() {
    let (conn, config, _temp_dir) = setup_persistence_test("engine_range");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = Project {
        id: "p_rng".to_string(),
        name: "RangeProj".to_string(),
        color: "green".to_string(),
        created_at: Utc::now().to_rfc3339(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    persistence.projects.create(project).unwrap();

    let task = Task {
        id: "t_rng".to_string(),
        project_id: "p_rng".to_string(),
        parent_task_id: None,
        name: "TaskRange".to_string(),
        completed: false,
        created_at: Utc::now().to_rfc3339(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
    persistence.tasks.create(task).unwrap();

    // 10:00 to 11:00 (3600s)
    let s1 = "2026-06-15T10:00:00Z";
    let e1 = "2026-06-15T11:00:00Z";
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        ["l_rng1", "t_rng", s1, e1],
    )
    .unwrap();

    // Range filtering: 10:30 to 11:30 -> should give 1800s (from 10:30 to 11:00)
    let filter = oxy_flow::types::ElapsedRangeFilter {
        task_id: Some("t_rng".to_string()),
        project_id: None,
        start_date: Some("2026-06-15T10:30:00Z".to_string()),
        end_date: Some("2026-06-15T11:30:00Z".to_string()),
        now_iso: None,
    };

    let elapsed = engine.calculate_elapsed_range(&filter).unwrap();
    assert_eq!(elapsed.as_secs(), 1800);
}

