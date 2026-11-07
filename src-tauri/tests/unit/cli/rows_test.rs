use oxyflow_timelog::cli::exporters::rows::{
    flatten_project, flatten_report, flatten_task, RowsError,
};
use oxyflow_timelog::cli::formatters::{
    ReportProjectDto, ReportSubtaskDto, ReportTaskDto, ReportTreeDto,
};

#[test]
fn test_given_empty_tree_when_flatten_then_returns_empty_vec() {
    // Arrange
    let tree = ReportTreeDto {
        period: "Today".to_string(),
        total_seconds: 0,
        total_formatted: "00m 00s".to_string(),
        projects: vec![],
        entries: vec![],
    };

    // Act
    let rows = flatten_report(&tree).unwrap();

    // Assert
    assert!(rows.is_empty());
}

#[test]
fn test_given_task_without_subtasks_when_flatten_then_returns_single_row_with_none_subtask() {
    // Arrange
    let task = ReportTaskDto {
        id: "t1".to_string(),
        name: "Coding".to_string(),
        duration_seconds: 3600,
        duration_formatted: "01h 00m".to_string(),
        percentage: 100.0,
        subtasks: vec![],
    };

    // Act
    let rows = flatten_task("p1", "Project A", &task).unwrap();

    // Assert
    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].project_id, "p1");
    assert_eq!(rows[0].project_name, "Project A");
    assert_eq!(rows[0].task_id, "t1");
    assert_eq!(rows[0].task_name, "Coding");
    assert_eq!(rows[0].subtask_id, None);
    assert_eq!(rows[0].subtask_name, None);
    assert_eq!(rows[0].duration_seconds, 3600);
    assert_eq!(rows[0].duration_formatted, "01h 00m");
    assert_eq!(rows[0].percentage, 100.0);
}

#[test]
fn test_given_task_with_single_subtask_and_direct_time_when_flatten_then_returns_both() {
    // Arrange
    let task = ReportTaskDto {
        id: "t1".to_string(),
        name: "Feature".to_string(),
        duration_seconds: 3600,
        duration_formatted: "01h 00m".to_string(),
        percentage: 100.0,
        subtasks: vec![ReportSubtaskDto {
            id: "s1".to_string(),
            name: "Sub A".to_string(),
            duration_seconds: 1200,
            duration_formatted: "20m 00s".to_string(),
            percentage: 33.3,
        }],
    };

    // Act
    let rows = flatten_task("p1", "Project A", &task).unwrap();

    // Assert: Direct time (3600 - 1200 = 2400s) + Subtask A (1200s)
    assert_eq!(rows.len(), 2);
    assert_eq!(rows[0].task_name, "Feature");
    assert_eq!(rows[0].subtask_id, None);
    assert_eq!(rows[0].duration_seconds, 2400);
    assert_eq!(rows[0].duration_formatted, "40m 00s");

    assert_eq!(rows[1].task_name, "Feature");
    assert_eq!(rows[1].subtask_id, Some("s1".to_string()));
    assert_eq!(rows[1].duration_seconds, 1200);
    assert_eq!(rows[1].duration_formatted, "20m 00s");
}

#[test]
fn test_given_task_with_subtasks_and_direct_time_when_flatten_then_returns_direct_and_subtasks() {
    // Arrange
    let task = ReportTaskDto {
        id: "t1".to_string(),
        name: "Feature".to_string(),
        duration_seconds: 3600,
        duration_formatted: "01h 00m".to_string(),
        percentage: 80.0,
        subtasks: vec![
            ReportSubtaskDto {
                id: "s1".to_string(),
                name: "Sub A".to_string(),
                duration_seconds: 1200,
                duration_formatted: "20m 00s".to_string(),
                percentage: 26.7,
            },
            ReportSubtaskDto {
                id: "s2".to_string(),
                name: "Sub B".to_string(),
                duration_seconds: 600,
                duration_formatted: "10m 00s".to_string(),
                percentage: 13.3,
            },
        ],
    };

    // Act
    let rows = flatten_task("p1", "Project A", &task).unwrap();

    // Assert
    assert_eq!(rows.len(), 3);

    // Row 1: Direct time (3600 - 1800 = 1800s, 50% of 80% = 40%)
    assert_eq!(rows[0].task_name, "Feature");
    assert_eq!(rows[0].subtask_id, None);
    assert_eq!(rows[0].subtask_name, None);
    assert_eq!(rows[0].duration_seconds, 1800);
    assert_eq!(rows[0].duration_formatted, "30m 00s");
    assert!((rows[0].percentage - 40.0).abs() < 1e-6);

    // Row 2: Subtask A
    assert_eq!(rows[1].task_name, "Feature");
    assert_eq!(rows[1].subtask_id, Some("s1".to_string()));
    assert_eq!(rows[1].subtask_name, Some("Sub A".to_string()));
    assert_eq!(rows[1].duration_seconds, 1200);
    assert_eq!(rows[1].duration_formatted, "20m 00s");
    assert_eq!(rows[1].percentage, 26.7);

    // Row 3: Subtask B
    assert_eq!(rows[2].task_name, "Feature");
    assert_eq!(rows[2].subtask_id, Some("s2".to_string()));
    assert_eq!(rows[2].subtask_name, Some("Sub B".to_string()));
    assert_eq!(rows[2].duration_seconds, 600);
    assert_eq!(rows[2].duration_formatted, "10m 00s");
    assert_eq!(rows[2].percentage, 13.3);
}

#[test]
fn test_given_task_with_subtasks_and_zero_direct_time_when_flatten_then_skips_direct_row() {
    // Arrange
    let task = ReportTaskDto {
        id: "t1".to_string(),
        name: "Feature".to_string(),
        duration_seconds: 1800,
        duration_formatted: "30m 00s".to_string(),
        percentage: 50.0,
        subtasks: vec![ReportSubtaskDto {
            id: "s1".to_string(),
            name: "Sub A".to_string(),
            duration_seconds: 1800,
            duration_formatted: "30m 00s".to_string(),
            percentage: 50.0,
        }],
    };

    // Act
    let rows = flatten_task("p1", "Project A", &task).unwrap();

    // Assert
    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].subtask_id, Some("s1".to_string()));
    assert_eq!(rows[0].subtask_name, Some("Sub A".to_string()));
    assert_eq!(rows[0].duration_seconds, 1800);
}

#[test]
fn test_given_task_with_multiple_subtasks_equal_to_parent_when_flatten_then_only_emits_subtasks() {
    // Arrange
    let task = ReportTaskDto {
        id: "t1".to_string(),
        name: "Feature".to_string(),
        duration_seconds: 1800,
        duration_formatted: "30m 00s".to_string(),
        percentage: 100.0,
        subtasks: vec![
            ReportSubtaskDto {
                id: "s1".to_string(),
                name: "Sub A".to_string(),
                duration_seconds: 1000,
                duration_formatted: "16m 40s".to_string(),
                percentage: 55.6,
            },
            ReportSubtaskDto {
                id: "s2".to_string(),
                name: "Sub B".to_string(),
                duration_seconds: 800,
                duration_formatted: "13m 20s".to_string(),
                percentage: 44.4,
            },
        ],
    };

    // Act
    let rows = flatten_task("p1", "Project A", &task).unwrap();

    // Assert: Direct time is 0 (1800 - 1800 = 0), only 2 subtask rows emitted
    assert_eq!(rows.len(), 2);
    assert_eq!(rows[0].subtask_id, Some("s1".to_string()));
    assert_eq!(rows[0].duration_seconds, 1000);
    assert_eq!(rows[1].subtask_id, Some("s2".to_string()));
    assert_eq!(rows[1].duration_seconds, 800);
}

#[test]
fn test_given_task_with_zero_duration_when_flatten_then_percentage_is_zero() {
    // Arrange
    let task = ReportTaskDto {
        id: "t0".to_string(),
        name: "Empty Task".to_string(),
        duration_seconds: 0,
        duration_formatted: "00m 00s".to_string(),
        percentage: 0.0,
        subtasks: vec![],
    };

    // Act
    let rows = flatten_task("p1", "Project A", &task).unwrap();

    // Assert
    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].duration_seconds, 0);
    assert_eq!(rows[0].percentage, 0.0);
}

#[test]
fn test_given_project_when_flatten_then_delegates_to_tasks() {
    // Arrange
    let project = ReportProjectDto {
        id: "p1".to_string(),
        name: "Project A".to_string(),
        duration_seconds: 1800,
        duration_formatted: "30m 00s".to_string(),
        percentage: 100.0,
        tasks: vec![ReportTaskDto {
            id: "t1".to_string(),
            name: "Task 1".to_string(),
            duration_seconds: 1800,
            duration_formatted: "30m 00s".to_string(),
            percentage: 100.0,
            subtasks: vec![],
        }],
    };

    // Act
    let rows = flatten_project(&project).unwrap();

    // Assert
    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].project_name, "Project A");
    assert_eq!(rows[0].task_name, "Task 1");
}

#[test]
fn test_given_subtask_duration_exceeding_parent_when_flatten_then_returns_invariant_error() {
    // Arrange: Subtasks sum = 600 + 500 = 1100s > task duration 1000s
    let task = ReportTaskDto {
        id: "t_invalid".to_string(),
        name: "Inconsistent Task".to_string(),
        duration_seconds: 1000,
        duration_formatted: "16m 40s".to_string(),
        percentage: 50.0,
        subtasks: vec![
            ReportSubtaskDto {
                id: "s1".to_string(),
                name: "Subtask 1".to_string(),
                duration_seconds: 600,
                duration_formatted: "10m 00s".to_string(),
                percentage: 30.0,
            },
            ReportSubtaskDto {
                id: "s2".to_string(),
                name: "Subtask 2".to_string(),
                duration_seconds: 500,
                duration_formatted: "08m 20s".to_string(),
                percentage: 25.0,
            },
        ],
    };

    // Act
    let result = flatten_task("p1", "Project A", &task);

    // Assert
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(
        err,
        RowsError::SubtaskDurationExceedsParent {
            task_id: "t_invalid".to_string(),
            task_name: "Inconsistent Task".to_string(),
            task_secs: 1000,
            subtasks_secs: 1100,
        }
    );
    assert!(err.to_string().contains("exceeds parent task duration"));
}

#[test]
fn test_given_subtask_durations_overflowing_u64_when_flatten_then_returns_overflow_error() {
    // Arrange: Sum of subtasks overflows u64::MAX
    let task = ReportTaskDto {
        id: "t_overflow".to_string(),
        name: "Overflow Task".to_string(),
        duration_seconds: u64::MAX,
        duration_formatted: "Huge".to_string(),
        percentage: 100.0,
        subtasks: vec![
            ReportSubtaskDto {
                id: "s1".to_string(),
                name: "Subtask 1".to_string(),
                duration_seconds: u64::MAX - 10,
                duration_formatted: "Huge".to_string(),
                percentage: 50.0,
            },
            ReportSubtaskDto {
                id: "s2".to_string(),
                name: "Subtask 2".to_string(),
                duration_seconds: 20,
                duration_formatted: "20s".to_string(),
                percentage: 50.0,
            },
        ],
    };

    // Act
    let result = flatten_task("p1", "Project A", &task);

    // Assert
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(
        err,
        RowsError::SubtaskDurationOverflow {
            task_id: "t_overflow".to_string(),
            task_name: "Overflow Task".to_string(),
        }
    );
    assert!(err.to_string().contains("integer overflow"));
}

#[test]
fn test_given_tree_with_inconsistent_task_when_flatten_report_then_propagates_error() {
    // Arrange
    let tree = ReportTreeDto {
        period: "Today".to_string(),
        total_seconds: 1000,
        total_formatted: "16m 40s".to_string(),
        projects: vec![ReportProjectDto {
            id: "p1".to_string(),
            name: "Project A".to_string(),
            duration_seconds: 1000,
            duration_formatted: "16m 40s".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t1".to_string(),
                name: "Bad Task".to_string(),
                duration_seconds: 500,
                duration_formatted: "08m 20s".to_string(),
                percentage: 50.0,
                subtasks: vec![ReportSubtaskDto {
                    id: "s1".to_string(),
                    name: "Subtask A".to_string(),
                    duration_seconds: 800,
                    duration_formatted: "13m 20s".to_string(),
                    percentage: 80.0,
                }],
            }],
        }],
        entries: vec![],
    };

    // Act
    let result = flatten_report(&tree);

    // Assert
    assert!(result.is_err());
    assert!(matches!(
        result.unwrap_err(),
        RowsError::SubtaskDurationExceedsParent { .. }
    ));
}
