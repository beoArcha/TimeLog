use oxy_flow::cli::formatters::constants::MSG_NO_REPORT_DATA;
use oxy_flow::cli::formatters::{
    format_duration, render_progress_bar, render_tree_string, ReportProjectDto, ReportSubtaskDto,
    ReportTaskDto, ReportTreeDto,
};

#[test]
fn test_given_seconds_when_format_duration_then_returns_padded_time_string() {
    // Arrange
    let secs_under_minute = 45;
    let secs_exact_hour = 3600;
    let secs_mixed = 3665;

    // Act
    let str_under_min = format_duration(secs_under_minute);
    let str_exact_hour = format_duration(secs_exact_hour);
    let str_mixed = format_duration(secs_mixed);

    // Assert
    assert_eq!(str_under_min, "00m 45s");
    assert_eq!(str_exact_hour, "01h 00m");
    assert_eq!(str_mixed, "01h 01m");
}

#[test]
fn test_given_percentages_when_render_progress_bar_then_draws_scaled_blocks() {
    // Arrange
    let zero_pct = 0.0;
    let half_pct = 50.0;
    let full_pct = 100.0;
    let overflow_pct = 120.0;

    // Act
    let bar_zero = render_progress_bar(zero_pct, 10);
    let bar_half = render_progress_bar(half_pct, 10);
    let bar_full = render_progress_bar(full_pct, 10);
    let bar_clamped = render_progress_bar(overflow_pct, 10);

    // Assert
    assert_eq!(bar_zero, "░░░░░░░░░░");
    assert_eq!(bar_half, "█████░░░░░");
    assert_eq!(bar_full, "██████████");
    assert_eq!(bar_clamped, "██████████");
}

#[test]
fn test_given_empty_report_tree_when_render_tree_string_then_returns_no_data_message() {
    // Arrange
    let empty_tree = ReportTreeDto {
        period: "Today".to_string(),
        total_seconds: 0,
        total_formatted: "00m 00s".to_string(),
        projects: vec![],
    };

    // Act
    let rendered = render_tree_string(&empty_tree);

    // Assert
    assert_eq!(rendered, MSG_NO_REPORT_DATA);
}

#[test]
fn test_given_hierarchical_report_when_render_tree_string_then_includes_unicode_box_drawing() {
    // Arrange
    let subtask = ReportSubtaskDto {
        id: "sub-1".to_string(),
        name: "Token Exchange".to_string(),
        duration_seconds: 1800,
        duration_formatted: "00h 30m".to_string(),
        percentage: 25.0,
    };
    let task = ReportTaskDto {
        id: "task-1".to_string(),
        name: "OAuth2 Login".to_string(),
        duration_seconds: 3600,
        duration_formatted: "01h 00m".to_string(),
        percentage: 50.0,
        subtasks: vec![subtask],
    };
    let project = ReportProjectDto {
        id: "proj-1".to_string(),
        name: "Backend Service".to_string(),
        duration_seconds: 7200,
        duration_formatted: "02h 00m".to_string(),
        percentage: 100.0,
        tasks: vec![task],
    };
    let tree = ReportTreeDto {
        period: "This Week".to_string(),
        total_seconds: 7200,
        total_formatted: "02h 00m".to_string(),
        projects: vec![project],
    };

    // Act
    let rendered = render_tree_string(&tree);

    // Assert
    assert!(rendered.contains("Time Tracking Hierarchy Report"));
    assert!(rendered.contains("Backend Service"));
    assert!(rendered.contains("OAuth2 Login"));
    assert!(rendered.contains("Token Exchange"));
    assert!(rendered.contains("└── "));
    assert!(rendered.contains("Total Time: 02h 00m"));
}

#[test]
fn test_given_report_tree_when_serialized_to_json_then_produces_valid_dto_schema() {
    // Arrange
    let tree = ReportTreeDto {
        period: "Today".to_string(),
        total_seconds: 3600,
        total_formatted: "01h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "p1".to_string(),
            name: "Core".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![],
        }],
    };

    // Act
    let json_str = serde_json::to_string(&tree).expect("failed to serialize tree");
    let parsed: ReportTreeDto = serde_json::from_str(&json_str).expect("failed to parse tree");

    // Assert
    assert_eq!(parsed.period, "Today");
    assert_eq!(parsed.total_seconds, 3600);
    assert_eq!(parsed.projects.len(), 1);
    assert_eq!(parsed.projects[0].name, "Core");
}
