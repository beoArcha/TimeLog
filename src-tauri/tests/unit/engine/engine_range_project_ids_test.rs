use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use chrono::Utc;
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::{ElapsedRangeFilter, PatchLog};

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
        .with_id("p_1")
        .with_name("Project 1")
        .with_color("blue")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_1")
        .with_project_id("p_1")
        .with_name("Task 1")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create(task).unwrap();

    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        ["l_1", "t_1", "2026-06-15T10:00:00Z", "2026-06-15T11:00:00Z"],
    )
    .unwrap();

    let patch = PatchLog {
        id: "patch_1".to_string(),
        project_id: "p_1".to_string(),
        task_id: Some("t_1".to_string()),
        start_time: "2026-06-15T11:00:00Z".to_string(),
        end_time: "2026-06-15T12:00:00Z".to_string(),
        patch_note: "Adjustment 1".to_string(),
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
    assert_eq!(result.total_seconds, 0);
    assert_eq!(elapsed.as_secs(), 0);
    assert_eq!(result.clamped_logs.len(), 0);
    assert_eq!(result.project_elapsed.len(), 0);
}
