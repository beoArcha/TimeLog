use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use chrono::Utc;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{ElapsedRangeFilter, PatchLog};

#[test]
fn test_engine_calculate_elapsed_range_clamps_to_window() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_range_clamp");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_rng")
        .with_name("RangeProj")
        .with_color("green")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_rng")
        .with_project_id("p_rng")
        .with_name("TaskRange")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create(task).unwrap();

    // 10:00 to 11:00 (3600s)
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "l_rng1",
            "t_rng",
            "2026-06-15T10:00:00Z",
            "2026-06-15T11:00:00Z",
        ],
    )
    .unwrap();

    let filter = ElapsedRangeFilter {
        task_id: Some("t_rng".to_string()),
        project_id: Some("p_rng".to_string()),
        from: Some("2026-06-15T10:30:00Z".to_string()),
        to: Some("2026-06-15T11:30:00Z".to_string()),
        include_patches: None,
    };

    // Act
    let elapsed = engine.calculate_elapsed_range(&filter).unwrap();

    // Assert
    assert_eq!(elapsed.as_secs(), 1800);
}

#[test]
fn test_engine_calculate_elapsed_range_returns_zero_when_filters_do_not_match() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_range_mismatch");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_rng")
        .with_name("RangeProj")
        .with_color("green")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_rng")
        .with_project_id("p_rng")
        .with_name("TaskRange")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create(task).unwrap();

    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "l_rng1",
            "t_rng",
            "2026-06-15T10:00:00Z",
            "2026-06-15T11:00:00Z",
        ],
    )
    .unwrap();

    let filter_mismatch_task = ElapsedRangeFilter {
        task_id: Some("other_task".to_string()),
        project_id: None,
        from: None,
        to: None,
        include_patches: None,
    };
    let filter_mismatch_proj = ElapsedRangeFilter {
        task_id: None,
        project_id: Some("other_proj".to_string()),
        from: None,
        to: None,
        include_patches: None,
    };

    // Act
    let task_secs = engine
        .calculate_elapsed_range(&filter_mismatch_task)
        .unwrap()
        .as_secs();
    let proj_secs = engine
        .calculate_elapsed_range(&filter_mismatch_proj)
        .unwrap()
        .as_secs();

    // Assert
    assert_eq!(task_secs, 0);
    assert_eq!(proj_secs, 0);
}

#[test]
fn test_engine_calculate_range_metrics_clamps_multi_day_log_across_midnight() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_range_metrics_multiday");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_rm")
        .with_name("RangeProject")
        .with_color("indigo")
        .with_created_at("2026-06-15T00:00:00Z")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_rm")
        .with_project_id("p_rm")
        .with_name("RangeTask")
        .with_created_at("2026-06-15T00:00:00Z")
        .build();
    persistence.tasks.create(task).unwrap();

    // Multi-day log: 2026-06-15T22:00:00Z to 2026-06-16T02:00:00Z (4h = 14400s)
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "l_rm1",
            "t_rm",
            "2026-06-15T22:00:00Z",
            "2026-06-16T02:00:00Z",
        ],
    )
    .unwrap();

    // Query for day 2: 2026-06-16T00:00:00Z to 2026-06-16T23:59:59Z
    let filter = ElapsedRangeFilter {
        task_id: None,
        project_id: Some("p_rm".to_string()),
        from: Some("2026-06-16T00:00:00Z".to_string()),
        to: Some("2026-06-16T23:59:59Z".to_string()),
        include_patches: Some(false),
    };

    // Act
    let result = engine.calculate_range_metrics(&filter, None).unwrap();

    // Assert
    // Only 2 hours (00:00 to 02:00) on June 16
    assert_eq!(result.total_seconds, 7200);
    assert_eq!(result.clamped_logs.len(), 1);
    assert_eq!(result.clamped_logs[0].original_duration_seconds, 14400);
    assert_eq!(result.clamped_logs[0].clamped_duration_seconds, 7200);
    assert!(result.clamped_logs[0].is_multi_day_segment);
}

#[test]
fn test_engine_calculate_range_metrics_includes_patch_logs_when_enabled() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_range_metrics_patches");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_rm")
        .with_name("RangeProject")
        .with_color("indigo")
        .with_created_at("2026-06-15T00:00:00Z")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_rm")
        .with_project_id("p_rm")
        .with_name("RangeTask")
        .with_created_at("2026-06-15T00:00:00Z")
        .build();
    persistence.tasks.create(task).unwrap();

    // Multi-day log: 2026-06-15T22:00:00Z to 2026-06-16T02:00:00Z (2 hours on June 16 = 7200s)
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "l_rm1",
            "t_rm",
            "2026-06-15T22:00:00Z",
            "2026-06-16T02:00:00Z",
        ],
    )
    .unwrap();

    // Patch log on 2026-06-16 from 08:00 to 09:00 (1h = 3600s)
    let patch = PatchLog {
        id: "patch_rm1".to_string(),
        project_id: "p_rm".to_string(),
        task_id: Some("t_rm".to_string()),
        start_time: "2026-06-16T08:00:00Z".to_string(),
        end_time: "2026-06-16T09:00:00Z".to_string(),
        patch_note: "Manual time adjustment".to_string(),
        is_system_event: Some(false),
    };
    persistence.patches.save(vec![patch]).unwrap();

    let filter_with_patches = ElapsedRangeFilter {
        task_id: None,
        project_id: Some("p_rm".to_string()),
        from: Some("2026-06-16T00:00:00Z".to_string()),
        to: Some("2026-06-16T23:59:59Z".to_string()),
        include_patches: Some(true),
    };

    // Act
    let result_patches = engine
        .calculate_range_metrics(&filter_with_patches, None)
        .unwrap();

    // Assert
    // 7200s (log) + 3600s (patch) = 10800s
    assert_eq!(result_patches.total_seconds, 10800);
    assert_eq!(result_patches.clamped_logs.len(), 2);
}
