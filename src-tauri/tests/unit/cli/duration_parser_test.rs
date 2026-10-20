use oxy_flow::cli::shared::utils::{parse_duration_seconds, DurationParseError};

#[test]
fn test_given_minutes_notation_when_parsing_duration_then_returns_correct_seconds() {
    // Arrange
    let input_m = "45m";
    let input_plain_digits = "90";

    // Act
    let result_m = parse_duration_seconds(input_m);
    let result_plain = parse_duration_seconds(input_plain_digits);

    // Assert
    assert_eq!(result_m, Ok(2700));
    assert_eq!(result_plain, Ok(5400));
}

#[test]
fn test_given_compound_hours_and_minutes_when_parsing_duration_then_returns_correct_seconds() {
    // Arrange
    let compound = "1h30m";
    let hours_only = "2h";

    // Act
    let result_compound = parse_duration_seconds(compound);
    let result_hours = parse_duration_seconds(hours_only);

    // Assert
    assert_eq!(result_compound, Ok(5400));
    assert_eq!(result_hours, Ok(7200));
}

#[test]
fn test_given_invalid_string_when_parsing_duration_then_returns_typed_error() {
    // Arrange
    let empty = "";
    let invalid_chars = "abc";

    // Act
    let result_empty = parse_duration_seconds(empty);
    let result_invalid = parse_duration_seconds(invalid_chars);

    // Assert
    assert_eq!(result_empty, Err(DurationParseError::Empty));
    assert!(matches!(
        result_invalid,
        Err(DurationParseError::UnrecognizedChar('a', _))
    ));
}
