use crate::shared::test_db::setup_persistence_test;
use chrono::Utc;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{ElapsedRangeFilter, Project, Task};

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
        project_id: Some("p_rng".to_string()),
        from: Some("2026-06-15T10:30:00Z".to_string()),
        to: Some("2026-06-15T11:30:00Z".to_string()),
        include_patches: None,
    };

    let elapsed = engine.calculate_elapsed_range(&filter).unwrap();
    assert_eq!(elapsed.as_secs(), 1800);

    // Mismatched task_id
    let filter_mismatch_task = oxy_flow::types::ElapsedRangeFilter {
        task_id: Some("other_task".to_string()),
        project_id: None,
        from: None,
        to: None,
        include_patches: None,
    };
    assert_eq!(
        engine
            .calculate_elapsed_range(&filter_mismatch_task)
            .unwrap()
            .as_secs(),
        0
    );

    // Mismatched project_id
    let filter_mismatch_proj = oxy_flow::types::ElapsedRangeFilter {
        task_id: None,
        project_id: Some("other_proj".to_string()),
        from: None,
        to: None,
        include_patches: None,
    };
    assert_eq!(
        engine
            .calculate_elapsed_range(&filter_mismatch_proj)
            .unwrap()
            .as_secs(),
        0
    );
}

#[test]
fn test_engine_calculate_range_metrics_multi_day_and_patches() {
    let (conn, config, _temp_dir) = setup_persistence_test("engine_range_metrics");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = Project {
        id: "p_rm".to_string(),
        name: "RangeProject".to_string(),
        color: "indigo".to_string(),
        created_at: "2026-06-15T00:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        description: None,
        icon: None,
        tags: None,
        edit_history: None,
    };
    persistence.projects.create(project).unwrap();

    let task = Task {
        id: "t_rm".to_string(),
        project_id: "p_rm".to_string(),
        parent_task_id: None,
        name: "RangeTask".to_string(),
        completed: false,
        created_at: "2026-06-15T00:00:00Z".to_string(),
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
        status: Some(oxy_flow::types::TaskStatus::Todo),
    };
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

    // Patch log on 2026-06-16 from 08:00 to 09:00 (1h = 3600s)
    let patch = oxy_flow::types::PatchLog {
        id: "patch_rm1".to_string(),
        project_id: "p_rm".to_string(),
        task_id: Some("t_rm".to_string()),
        start_time: "2026-06-16T08:00:00Z".to_string(),
        end_time: "2026-06-16T09:00:00Z".to_string(),
        patch_note: "Manual time adjustment".to_string(),
        is_system_event: Some(false),
    };
    persistence.patches.save(vec![patch]).unwrap();

    // Query for day 2: 2026-06-16T00:00:00Z to 2026-06-16T23:59:59Z
    let filter = ElapsedRangeFilter {
        task_id: None,
        project_id: Some("p_rm".to_string()),
        from: Some("2026-06-16T00:00:00Z".to_string()),
        to: Some("2026-06-16T23:59:59Z".to_string()),
        include_patches: Some(false),
    };

    let result = engine.calculate_range_metrics(&filter, None).unwrap();
    // Only 2 hours (00:00 to 02:00) on June 16
    assert_eq!(result.total_seconds, 7200);
    assert_eq!(result.clamped_logs.len(), 1);
    assert_eq!(result.clamped_logs[0].original_duration_seconds, 14400);
    assert_eq!(result.clamped_logs[0].clamped_duration_seconds, 7200);
    assert!(result.clamped_logs[0].is_multi_day_segment);

    // Query with patches enabled
    let filter_with_patches = ElapsedRangeFilter {
        include_patches: Some(true),
        ..filter
    };
    let result_patches = engine
        .calculate_range_metrics(&filter_with_patches, None)
        .unwrap();
    // 7200s (log) + 3600s (patch) = 10800s
    assert_eq!(result_patches.total_seconds, 10800);
    assert_eq!(result_patches.clamped_logs.len(), 2);
}
