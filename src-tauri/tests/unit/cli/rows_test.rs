use oxyflow_timelog::cli::exporters::rows::{flatten_project, flatten_report, flatten_task};
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
    };

    // Act
    let rows = flatten_report(&tree);

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
    let rows = flatten_task("p1", "Project A", &task);

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
    let rows = flatten_task("p1", "Project A", &task);

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
    let rows = flatten_task("p1", "Project A", &task);

    // Assert
    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].subtask_id, Some("s1".to_string()));
    assert_eq!(rows[0].subtask_name, Some("Sub A".to_string()));
    assert_eq!(rows[0].duration_seconds, 1800);
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
    let rows = flatten_task("p1", "Project A", &task);

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
    let rows = flatten_project(&project);

    // Assert
    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].project_name, "Project A");
    assert_eq!(rows[0].task_name, "Task 1");
}
