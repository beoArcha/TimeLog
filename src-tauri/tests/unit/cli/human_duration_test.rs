use oxyflow_timelog::cli::formatters::format_human_duration;

#[test]
fn test_given_seconds_under_minute_boundaries_when_format_human_duration_then_returns_seconds_only()
{
    // Arrange
    let zero_secs = 0;
    let fifty_nine_secs = 59;

    // Act
    let zero_formatted = format_human_duration(zero_secs);
    let fifty_nine_formatted = format_human_duration(fifty_nine_secs);

    // Assert
    assert_eq!(zero_formatted, "0s");
    assert_eq!(fifty_nine_formatted, "59s");
}

#[test]
fn test_given_minute_range_boundaries_when_format_human_duration_then_returns_minutes_only() {
    // Arrange
    let one_minute = 60;
    let just_under_hour = 3599;

    // Act
    let one_minute_formatted = format_human_duration(one_minute);
    let just_under_hour_formatted = format_human_duration(just_under_hour);

    // Assert
    assert_eq!(one_minute_formatted, "1m");
    assert_eq!(just_under_hour_formatted, "59m");
}

#[test]
fn test_given_hour_range_boundaries_when_format_human_duration_then_returns_hours_and_padded_minutes(
) {
    // Arrange
    let exact_hour = 3600;
    let mixed_hour = 3660;
    let large_duration = 360000;

    // Act
    let exact_hour_formatted = format_human_duration(exact_hour);
    let mixed_hour_formatted = format_human_duration(mixed_hour);
    let large_duration_formatted = format_human_duration(large_duration);

    // Assert
    assert_eq!(exact_hour_formatted, "1h 00m");
    assert_eq!(mixed_hour_formatted, "1h 01m");
    assert_eq!(large_duration_formatted, "100h 00m");
}
