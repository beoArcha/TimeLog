use oxyflow_timelog::cli::CliError;
use oxyflow_timelog::engine::EngineError;

#[test]
fn test_given_invalid_timezone_when_converting_to_cli_error_then_maps_to_syntax_exit_code_2() {
    // Arrange
    let error = EngineError::InvalidTimezone("Mars/Olympus".to_string());

    // Act
    let cli_error = CliError::from(error);

    // Assert
    assert_eq!(cli_error.exit_code(), 2);
    assert_eq!(cli_error.error_code().as_str(), "CLI_SYNTAX_INVALID_ARGS");
}

#[test]
fn test_given_invalid_range_input_when_converting_to_cli_error_then_maps_to_syntax_exit_code_2() {
    // Arrange
    let error = EngineError::InvalidRangeInput("bad".to_string());

    // Act
    let cli_error = CliError::from(error);

    // Assert
    assert_eq!(cli_error.exit_code(), 2);
    assert_eq!(cli_error.error_code().as_str(), "CLI_SYNTAX_INVALID_ARGS");
}

#[test]
fn test_given_wrapped_range_error_when_mapping_codes_then_maps_to_syntax_exit_code_2() {
    // Arrange
    let error = CliError::Engine(EngineError::InvalidRangeInput("bad".to_string()));

    // Act
    let exit_code = error.exit_code();

    // Assert
    assert_eq!(exit_code, 2);
    assert_eq!(error.error_code().as_str(), "CLI_SYNTAX_INVALID_ARGS");
}
