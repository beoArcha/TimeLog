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
        from: Some("2026-06-15T10:30:00Z".to_string()),
        to: Some("2026-06-15T11:30:00Z".to_string()),
    };

    let elapsed = engine.calculate_elapsed_range(&filter).unwrap();
    assert_eq!(elapsed.as_secs(), 1800);
}

#[test]
fn test_engine_computed_metrics() {
    let (conn, config, _temp_dir) = setup_persistence_test("engine_computed_metrics");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = Project {
        id: "p_comp".to_string(),
        name: "CompProj".to_string(),
        color: "orange".to_string(),
        created_at: "2026-06-15T00:00:00Z".to_string(),
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
        id: "t_comp".to_string(),
        project_id: "p_comp".to_string(),
        parent_task_id: None,
        name: "CompTask".to_string(),
        completed: false,
        created_at: "2026-06-15T00:00:00Z".to_string(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
    persistence.tasks.create(task).unwrap();

    let subtask = Task {
        id: "t_comp_sub".to_string(),
        project_id: "p_comp".to_string(),
        parent_task_id: Some("t_comp".to_string()),
        name: "CompSubtask".to_string(),
        completed: false,
        created_at: "2026-06-15T00:00:00Z".to_string(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
    persistence.tasks.create_subtask(subtask).unwrap();

    // Insert closed log for parent (12:00 to 12:30 = 1800s)
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "l_comp1",
            "t_comp",
            "2026-06-15T12:00:00Z",
            "2026-06-15T12:30:00Z",
        ],
    )
    .unwrap();

    // Insert active log for subtask (start 13:00, against 14:00 snapshot = 3600s)
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, NULL)",
        ["l_comp2", "t_comp_sub", "2026-06-15T13:00:00Z"],
    )
    .unwrap();

    let metrics = engine
        .get_computed_metrics(Some("2026-06-15T14:00:00Z"))
        .unwrap();

    assert_eq!(metrics.snapshot_now_iso, "2026-06-15T14:00:00+00:00");

    let t1 = metrics.tasks.get("t_comp").unwrap();
    assert_eq!(t1.elapsed_seconds, 5400);
    assert_eq!(t1.self_elapsed_seconds, 1800);
    assert_eq!(t1.is_running, false);
    assert_eq!(t1.has_running_child, true);

    let t_sub = metrics.tasks.get("t_comp_sub").unwrap();
    assert_eq!(t_sub.elapsed_seconds, 3600);
    assert_eq!(t_sub.self_elapsed_seconds, 3600);
    assert_eq!(t_sub.is_running, true);
    assert_eq!(t_sub.has_running_child, false);

    let p = metrics.projects.get("p_comp").unwrap();
    assert_eq!(p.total_elapsed_seconds, 5400);
    assert_eq!(p.today_elapsed_seconds, 5400);
    assert_eq!(p.active_task_count, 2);
    assert_eq!(p.completed_task_count, 0);
    assert_eq!(p.is_running, true);
}
