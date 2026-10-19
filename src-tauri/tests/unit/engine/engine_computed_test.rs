use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::ElapsedRangeFilter;

#[test]
fn test_engine_computed_metrics() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_computed_metrics");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_comp")
        .with_name("CompProj")
        .with_color("orange")
        .with_created_at("2026-06-15T00:00:00Z")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_comp")
        .with_project_id("p_comp")
        .with_name("CompTask")
        .with_created_at("2026-06-15T00:00:00Z")
        .build();
    persistence.tasks.create(task).unwrap();

    let subtask = TaskBuilder::new()
        .with_id("t_comp_sub")
        .with_project_id("p_comp")
        .with_parent("t_comp")
        .with_name("CompSubtask")
        .with_created_at("2026-06-15T00:00:00Z")
        .build();
    persistence.tasks.create(subtask).unwrap();

    // Closed log for parent (12:00 to 12:30 = 1800s)
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

    // Active log for subtask (start 13:00, against 14:00 snapshot = 3600s)
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, NULL)",
        ["l_comp2", "t_comp_sub", "2026-06-15T13:00:00Z"],
    )
    .unwrap();

    // Act
    let metrics = engine
        .get_computed_metrics(Some("2026-06-15T14:00:00Z"))
        .unwrap();

    // Assert
    assert_eq!(metrics.snapshot_now_iso, "2026-06-15T14:00:00+00:00");

    let t1 = metrics.tasks.get("t_comp").unwrap();
    assert_eq!(t1.elapsed_seconds, 5400);
    assert_eq!(t1.self_elapsed_seconds, 1800);
    assert!(!t1.is_running);
    assert!(t1.has_running_child);

    let t_sub = metrics.tasks.get("t_comp_sub").unwrap();
    assert_eq!(t_sub.elapsed_seconds, 3600);
    assert_eq!(t_sub.self_elapsed_seconds, 3600);
    assert!(t_sub.is_running);
    assert!(!t_sub.has_running_child);

    let p = metrics.projects.get("p_comp").unwrap();
    assert_eq!(p.total_elapsed_seconds, 5400);
    assert_eq!(p.today_elapsed_seconds, 5400);
    assert_eq!(p.active_task_count, 2);
    assert_eq!(p.completed_task_count, 0);
    assert!(p.is_running);
}

#[test]
fn test_engine_metrics_leap_year_boundary() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_metrics_leap_year");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_leap")
        .with_name("LeapProject")
        .with_color("teal")
        .with_created_at("2024-02-28T00:00:00Z")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_leap")
        .with_project_id("p_leap")
        .with_name("LeapTask")
        .with_created_at("2024-02-28T00:00:00Z")
        .build();
    persistence.tasks.create(task).unwrap();

    // 2024-02-28T22:00:00Z to 2024-03-01T04:00:00Z: 2h + 24h (Feb 29) + 4h = 30 hours = 108,000s
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "l_leap",
            "t_leap",
            "2024-02-28T22:00:00Z",
            "2024-03-01T04:00:00Z",
        ],
    )
    .unwrap();

    // Act
    let metrics = engine
        .get_computed_metrics(Some("2024-03-01T12:00:00Z"))
        .unwrap();

    let filter = ElapsedRangeFilter {
        from: Some("2024-02-29T00:00:00Z".to_string()),
        to: Some("2024-03-01T00:00:00Z".to_string()),
        task_id: Some("t_leap".to_string()),
        project_id: None,
        include_patches: None,
    };
    let leap_day_secs = engine.calculate_elapsed_range(&filter).unwrap().as_secs();

    // Assert
    let task_metric = metrics.tasks.get("t_leap").unwrap();
    assert_eq!(task_metric.elapsed_seconds, 108000);

    let proj_metric = metrics.projects.get("p_leap").unwrap();
    assert_eq!(proj_metric.total_elapsed_seconds, 108000);
    assert_eq!(leap_day_secs, 86400);
}

#[test]
fn test_engine_metrics_new_year_boundary() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_metrics_new_year");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_ny")
        .with_name("NewYearProject")
        .with_color("amber")
        .with_created_at("2025-12-31T00:00:00Z")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_ny")
        .with_project_id("p_ny")
        .with_name("NewYearTask")
        .with_created_at("2025-12-31T00:00:00Z")
        .build();
    persistence.tasks.create(task).unwrap();

    // 2025-12-31T20:00:00Z (Wednesday) to 2026-01-01T08:00:00Z (Thursday) = 12h = 43,200s
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "l_ny",
            "t_ny",
            "2025-12-31T20:00:00Z",
            "2026-01-01T08:00:00Z",
        ],
    )
    .unwrap();

    // Act
    let metrics = engine
        .get_computed_metrics(Some("2026-01-01T12:00:00Z"))
        .unwrap();

    // Assert
    let p = metrics.projects.get("p_ny").unwrap();
    assert_eq!(p.total_elapsed_seconds, 43200);
    // Jan 1: 00:00 to 08:00 = 8h = 28,800s
    assert_eq!(p.today_elapsed_seconds, 28800);
    // Week started Monday 2025-12-29, so all 43,200s is within the week
    assert_eq!(p.this_week_elapsed_seconds, 43200);
}

#[test]
fn test_engine_metrics_multi_day_active_log() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_metrics_multi_day_active");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_act")
        .with_name("ActiveProject")
        .with_color("indigo")
        .with_created_at("2026-06-11T00:00:00Z")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_act")
        .with_project_id("p_act")
        .with_name("ActiveTask")
        .with_created_at("2026-06-11T00:00:00Z")
        .build();
    persistence.tasks.create(task).unwrap();

    // Thursday 2026-06-11T10:00:00Z to Saturday 2026-06-13T10:00:00Z (48 hours = 172,800s, active)
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, NULL)",
        ["l_act", "t_act", "2026-06-11T10:00:00Z"],
    )
    .unwrap();

    // Act
    let metrics = engine
        .get_computed_metrics(Some("2026-06-13T10:00:00Z"))
        .unwrap();

    // Assert
    let t = metrics.tasks.get("t_act").unwrap();
    assert_eq!(t.elapsed_seconds, 172800);
    assert!(t.is_running);

    let p = metrics.projects.get("p_act").unwrap();
    assert_eq!(p.total_elapsed_seconds, 172800);
    // Saturday 00:00 to 10:00 = 10h = 36,000s
    assert_eq!(p.today_elapsed_seconds, 36000);
    assert_eq!(p.this_week_elapsed_seconds, 172800);
    assert!(p.is_running);
}
