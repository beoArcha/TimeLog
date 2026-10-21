use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use chrono::{DateTime, Utc};
use oxy_flow::engine::metrics::clamping::{clamp_interval, IntervalInput};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::ElapsedRangeFilter;

#[test]
fn test_given_spring_dst_jump_when_calculating_metrics_then_measures_exactly_7200_seconds() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_dst_spring");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_spring")
        .with_name("Spring Project")
        .with_color("yellow")
        .with_created_at("2026-03-29T00:00:00Z".to_string())
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_spring")
        .with_project_id("p_spring")
        .with_name("Spring Task")
        .with_created_at("2026-03-29T00:00:00Z".to_string())
        .build();
    persistence.tasks.create(task).unwrap();

    // Central European Summer Time transition: 2026-03-29 01:00 UTC (02:00 CET -> 03:00 CEST)
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "log_spring",
            "t_spring",
            "2026-03-29T01:30:00Z",
            "2026-03-29T03:30:00Z",
        ],
    )
    .unwrap();

    // Act
    let elapsed = engine.calculate_task_elapsed("t_spring").unwrap();
    let filter = ElapsedRangeFilter {
        from: Some("2026-03-29T00:00:00Z".to_string()),
        to: Some("2026-03-29T23:59:59Z".to_string()),
        ..Default::default()
    };
    let range_metrics = engine
        .calculate_range_metrics(&filter, Some("2026-03-29T04:00:00Z"))
        .unwrap();
    let computed = engine
        .get_computed_metrics(Some("2026-03-29T04:00:00Z"))
        .unwrap();

    // Assert
    assert_eq!(elapsed.as_secs(), 7200);
    assert_eq!(range_metrics.total_seconds, 7200);
    assert_eq!(
        computed
            .projects
            .get("p_spring")
            .unwrap()
            .total_elapsed_seconds,
        7200
    );
    assert_eq!(
        computed.tasks.get("t_spring").unwrap().self_elapsed_seconds,
        7200
    );
}

#[test]
fn test_given_autumn_dst_transition_when_calculating_metrics_then_measures_exactly_7200_seconds() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_dst_autumn");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_autumn")
        .with_name("Autumn Project")
        .with_color("orange")
        .with_created_at("2026-10-25T00:00:00Z".to_string())
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_autumn")
        .with_project_id("p_autumn")
        .with_name("Autumn Task")
        .with_created_at("2026-10-25T00:00:00Z".to_string())
        .build();
    persistence.tasks.create(task).unwrap();

    // Central European Summer Time rollback: 2026-10-25 01:00 UTC (03:00 CEST -> 02:00 CET)
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "log_autumn",
            "t_autumn",
            "2026-10-25T01:30:00Z",
            "2026-10-25T03:30:00Z",
        ],
    )
    .unwrap();

    // Act
    let elapsed = engine.calculate_task_elapsed("t_autumn").unwrap();
    let filter = ElapsedRangeFilter {
        from: Some("2026-10-25T00:00:00Z".to_string()),
        to: Some("2026-10-25T23:59:59Z".to_string()),
        ..Default::default()
    };
    let range_metrics = engine
        .calculate_range_metrics(&filter, Some("2026-10-25T04:00:00Z"))
        .unwrap();
    let computed = engine
        .get_computed_metrics(Some("2026-10-25T04:00:00Z"))
        .unwrap();

    // Assert
    assert_eq!(elapsed.as_secs(), 7200);
    assert_eq!(range_metrics.total_seconds, 7200);
    assert_eq!(
        computed
            .projects
            .get("p_autumn")
            .unwrap()
            .total_elapsed_seconds,
        7200
    );
    assert_eq!(
        computed.tasks.get("t_autumn").unwrap().self_elapsed_seconds,
        7200
    );
}

#[test]
fn test_given_multiday_log_when_clamping_to_daily_slices_then_conserves_total_duration() {
    // Arrange: 72 hours from Friday to Monday = 259,200 seconds
    let start_time = "2026-06-12T00:00:00Z";
    let end_time = "2026-06-15T00:00:00Z";
    let expected_total_seconds: u64 = 72 * 3600;

    let input = IntervalInput {
        id: "log_72h",
        project_id: "p_multiday",
        task_id: "t_multiday",
        start_time,
        end_time: Some(end_time),
        note: None,
        is_patch: false,
    };

    let day1_start = DateTime::parse_from_rfc3339("2026-06-12T00:00:00Z")
        .unwrap()
        .with_timezone(&Utc);
    let day1_end = DateTime::parse_from_rfc3339("2026-06-13T00:00:00Z")
        .unwrap()
        .with_timezone(&Utc);

    let day2_start = DateTime::parse_from_rfc3339("2026-06-13T00:00:00Z")
        .unwrap()
        .with_timezone(&Utc);
    let day2_end = DateTime::parse_from_rfc3339("2026-06-14T00:00:00Z")
        .unwrap()
        .with_timezone(&Utc);

    let day3_start = DateTime::parse_from_rfc3339("2026-06-14T00:00:00Z")
        .unwrap()
        .with_timezone(&Utc);
    let day3_end = DateTime::parse_from_rfc3339("2026-06-15T00:00:00Z")
        .unwrap()
        .with_timezone(&Utc);

    let reference_now = day3_end;

    // Act
    let slice1 = clamp_interval(input, Some(day1_start), Some(day1_end), reference_now)
        .unwrap()
        .unwrap();
    let slice2 = clamp_interval(input, Some(day2_start), Some(day2_end), reference_now)
        .unwrap()
        .unwrap();
    let slice3 = clamp_interval(input, Some(day3_start), Some(day3_end), reference_now)
        .unwrap()
        .unwrap();

    let sum_of_slices = slice1.clamped_duration_seconds
        + slice2.clamped_duration_seconds
        + slice3.clamped_duration_seconds;

    // Assert
    assert_eq!(slice1.clamped_duration_seconds, 86400);
    assert_eq!(slice2.clamped_duration_seconds, 86400);
    assert_eq!(slice3.clamped_duration_seconds, 86400);
    assert_eq!(sum_of_slices, expected_total_seconds);

    assert_eq!(slice1.original_duration_seconds, expected_total_seconds);
    assert_eq!(slice2.original_duration_seconds, expected_total_seconds);
    assert_eq!(slice3.original_duration_seconds, expected_total_seconds);

    assert!(slice1.is_multi_day_segment);
    assert!(slice2.is_multi_day_segment);
    assert!(slice3.is_multi_day_segment);
}

#[test]
fn test_given_negative_interval_when_clamping_or_validating_then_rejects_without_corrupting_state()
{
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_neg_interval");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let invalid_input = IntervalInput {
        id: "log_invalid",
        project_id: "p_inv",
        task_id: "t_inv",
        start_time: "2026-06-15T15:00:00Z",
        end_time: Some("2026-06-15T14:00:00Z"),
        note: None,
        is_patch: false,
    };

    let project = ProjectBuilder::new()
        .with_id("p_clean")
        .with_name("Clean Project")
        .with_color("blue")
        .with_created_at("2026-06-15T00:00:00Z".to_string())
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_clean")
        .with_project_id("p_clean")
        .with_name("Clean Task")
        .with_created_at("2026-06-15T00:00:00Z".to_string())
        .build();
    persistence.tasks.create(task).unwrap();

    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "l_valid",
            "t_clean",
            "2026-06-15T10:00:00Z",
            "2026-06-15T11:00:00Z",
        ],
    )
    .unwrap();

    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
        [
            "l_corrupt",
            "t_clean",
            "2026-06-15T16:00:00Z",
            "2026-06-15T14:00:00Z",
        ],
    )
    .unwrap();

    // Act
    let clamp_result = clamp_interval(invalid_input, None, None, Utc::now()).unwrap();
    let validation_result = engine.validate_time_log(
        "log_neg",
        "t_clean",
        "2026-06-15T15:00:00Z",
        Some("2026-06-15T14:00:00Z"),
    );
    let computed = engine
        .get_computed_metrics(Some("2026-06-15T17:00:00Z"))
        .unwrap();

    // Assert
    assert!(clamp_result.is_none());
    assert!(validation_result.is_err());
    assert_eq!(
        computed
            .projects
            .get("p_clean")
            .unwrap()
            .total_elapsed_seconds,
        3600
    );
    assert_eq!(
        computed.tasks.get("t_clean").unwrap().self_elapsed_seconds,
        3600
    );
}
