use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use chrono::Utc;
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::{ElapsedRangeFilter, PatchLog};

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
        project_ids: None,
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
        project_ids: None,
        from: None,
        to: None,
        include_patches: None,
    };
    let filter_mismatch_proj = ElapsedRangeFilter {
        task_id: None,
        project_id: Some("other_proj".to_string()),
        project_ids: None,
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
        project_ids: None,
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
        project_ids: None,
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

#[test]
fn test_engine_calculate_range_metrics_propagates_persistence_error_on_subtask_query_failure() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_range_subtask_error");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let filter = ElapsedRangeFilter {
        task_id: Some("t_corrupt".to_string()),
        project_id: None,
        project_ids: None,
        from: Some("2026-06-15T00:00:00Z".to_string()),
        to: Some("2026-06-16T00:00:00Z".to_string()),
        include_patches: None,
    };

    // Drop the tasks table so get_subtasks returns a database error
    conn.execute("DROP TABLE tasks", []).unwrap();

    // Act
    let result = engine.calculate_range_metrics(&filter, None);

    // Assert
    assert!(
        result.is_err(),
        "range metrics must fail when subtask query fails"
    );
    match result.unwrap_err() {
        oxyflow_timelog::engine::EngineError::Persistence(_) => (),
        other => panic!("expected EngineError::Persistence, got {:?}", other),
    }
}

#[test]
fn test_engine_calculate_range_metrics_filters_by_project_ids_for_logs_and_patches() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_range_project_ids_filter");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project_a = ProjectBuilder::new()
        .with_id("p_included")
        .with_name("Project Included")
        .with_color("green")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    let project_b = ProjectBuilder::new()
        .with_id("p_excluded")
        .with_name("Project Excluded")
        .with_color("red")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.projects.create(project_a).unwrap();
    persistence.projects.create(project_b).unwrap();

    let task_a = TaskBuilder::new()
        .with_id("t_included")
        .with_project_id("p_included")
        .with_name("Task Included")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    let task_b = TaskBuilder::new()
        .with_id("t_excluded")
        .with_project_id("p_excluded")
        .with_name("Task Excluded")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create(task_a).unwrap();
    persistence.tasks.create(task_b).unwrap();

    // 10:00 to 11:00 (3600s) for included project
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "l_inc",
            "t_included",
            "2026-06-15T10:00:00Z",
            "2026-06-15T11:00:00Z",
        ],
    )
    .unwrap();

    // 10:00 to 11:00 (3600s) for excluded project
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "l_exc",
            "t_excluded",
            "2026-06-15T10:00:00Z",
            "2026-06-15T11:00:00Z",
        ],
    )
    .unwrap();

    // Patch for included project: 11:00 to 12:00 (3600s)
    let patch_inc = PatchLog {
        id: "patch_inc".to_string(),
        project_id: "p_included".to_string(),
        task_id: Some("t_included".to_string()),
        start_time: "2026-06-15T11:00:00Z".to_string(),
        end_time: "2026-06-15T12:00:00Z".to_string(),
        patch_note: "Included adjustment".to_string(),
        is_system_event: Some(false),
    };
    // Patch for excluded project: 11:00 to 12:00 (3600s)
    let patch_exc = PatchLog {
        id: "patch_exc".to_string(),
        project_id: "p_excluded".to_string(),
        task_id: Some("t_excluded".to_string()),
        start_time: "2026-06-15T11:00:00Z".to_string(),
        end_time: "2026-06-15T12:00:00Z".to_string(),
        patch_note: "Excluded adjustment".to_string(),
        is_system_event: Some(false),
    };
    persistence
        .patches
        .save(vec![patch_inc, patch_exc])
        .unwrap();

    let filter = ElapsedRangeFilter {
        task_id: None,
        project_id: None,
        project_ids: Some(vec!["p_included".to_string()]),
        from: Some("2026-06-15T00:00:00Z".to_string()),
        to: Some("2026-06-15T23:59:59Z".to_string()),
        include_patches: Some(true),
    };

    // Act
    let result = engine.calculate_range_metrics(&filter, None).unwrap();
    let elapsed = engine.calculate_elapsed_range(&filter).unwrap();

    // Assert
    // Only entries from "p_included" should be present: 3600s log + 3600s patch = 7200s
    assert_eq!(result.total_seconds, 7200);
    assert_eq!(elapsed.as_secs(), 7200);
    assert_eq!(result.clamped_logs.len(), 2);
    assert_eq!(result.project_elapsed.get("p_included"), Some(&7200));
    assert_eq!(result.project_elapsed.get("p_excluded"), None);
    assert!(result
        .clamped_logs
        .iter()
        .all(|l| l.project_id == "p_included"));
}

#[test]
fn test_engine_calculate_range_metrics_empty_project_ids_returns_no_logs_or_patches() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_range_empty_project_ids");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_any")
        .with_name("Any Project")
        .with_color("blue")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_any")
        .with_project_id("p_any")
        .with_name("Any Task")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create(task).unwrap();

    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "l_any",
            "t_any",
            "2026-06-15T10:00:00Z",
            "2026-06-15T11:00:00Z",
        ],
    )
    .unwrap();

    let patch = PatchLog {
        id: "patch_any".to_string(),
        project_id: "p_any".to_string(),
        task_id: Some("t_any".to_string()),
        start_time: "2026-06-15T11:00:00Z".to_string(),
        end_time: "2026-06-15T12:00:00Z".to_string(),
        patch_note: "Any adjustment".to_string(),
        is_system_event: Some(false),
    };
    persistence.patches.save(vec![patch]).unwrap();

    let filter = ElapsedRangeFilter {
        task_id: None,
        project_id: None,
        project_ids: Some(vec![]),
        from: Some("2026-06-15T00:00:00Z".to_string()),
        to: Some("2026-06-15T23:59:59Z".to_string()),
        include_patches: Some(true),
    };

    // Act
    let result = engine.calculate_range_metrics(&filter, None).unwrap();
    let elapsed = engine.calculate_elapsed_range(&filter).unwrap();

    // Assert
    // An empty project_ids list must exclude all logs and patches
    assert_eq!(result.total_seconds, 0);
    assert_eq!(elapsed.as_secs(), 0);
    assert_eq!(result.clamped_logs.len(), 0);
    assert!(result.project_elapsed.is_empty());
    assert!(result.task_elapsed.is_empty());
}

#[test]
fn test_engine_calculate_range_metrics_when_task_moved_to_different_project() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_range_task_moved");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let p1 = ProjectBuilder::new()
        .with_id("p_orig")
        .with_name("Original Project")
        .with_color("blue")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.projects.create(p1).unwrap();

    let p2 = ProjectBuilder::new()
        .with_id("p_dest")
        .with_name("Destination Project")
        .with_color("purple")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.projects.create(p2).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_moved")
        .with_project_id("p_orig")
        .with_name("Migrated Task")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create(task).unwrap();

    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "l_m1",
            "t_moved",
            "2026-06-15T10:00:00Z",
            "2026-06-15T11:00:00Z",
        ],
    )
    .unwrap();

    // Move task to destination project
    conn.execute(
        "UPDATE tasks SET project_id = ? WHERE id = ?",
        ["p_dest", "t_moved"],
    )
    .unwrap();

    // Act: filter by p_dest
    let filter_dest = ElapsedRangeFilter {
        task_id: None,
        project_id: Some("p_dest".to_string()),
        project_ids: None,
        from: Some("2026-06-15T00:00:00Z".to_string()),
        to: Some("2026-06-15T23:59:59Z".to_string()),
        include_patches: None,
    };
    let res_dest = engine.calculate_range_metrics(&filter_dest, None).unwrap();

    // Assert: logs belong to p_dest now
    assert_eq!(res_dest.total_seconds, 3600);
    assert_eq!(res_dest.clamped_logs.len(), 1);
    assert_eq!(res_dest.clamped_logs[0].project_id, "p_dest");
    assert_eq!(*res_dest.project_elapsed.get("p_dest").unwrap(), 3600);

    // Filter by p_orig: should return 0
    let filter_orig = ElapsedRangeFilter {
        task_id: None,
        project_id: Some("p_orig".to_string()),
        project_ids: None,
        from: Some("2026-06-15T00:00:00Z".to_string()),
        to: Some("2026-06-15T23:59:59Z".to_string()),
        include_patches: None,
    };
    let res_orig = engine.calculate_range_metrics(&filter_orig, None).unwrap();
    assert_eq!(res_orig.total_seconds, 0);
    assert_eq!(res_orig.clamped_logs.len(), 0);
}
