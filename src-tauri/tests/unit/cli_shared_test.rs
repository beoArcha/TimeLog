use chrono::DateTime;
use oxy_flow::cli::shared::output::CliOutput;
use oxy_flow::cli::shared::utils::{current_timestamp, generate_id};
use oxy_flow::cli::shared::validation::validate_id;
use oxy_flow::cli::CliError;
use uuid::Uuid;

#[test]
fn test_validate_id_valid() {
    // Arrange
    let padded_id = "  my-id-123  ";
    let simple_id = "abc";

    // Act
    let res_padded = validate_id(padded_id);
    let res_simple = validate_id(simple_id);

    // Assert
    assert_eq!(res_padded, Ok("my-id-123".to_string()));
    assert_eq!(res_simple, Ok("abc".to_string()));
}

#[test]
fn test_validate_id_empty() {
    // Arrange
    let empty_inputs = ["", "   ", "\n\t"];

    for input in empty_inputs {
        // Act
        let res = validate_id(input);

        // Assert
        assert_eq!(
            res,
            Err(CliError::Syntax(oxy_flow::cli::CliSyntaxError::EmptyId))
        );
    }
}

#[test]
fn test_generate_id() {
    // Arrange: rely on UUID v4 generator contract

    // Act
    let id = generate_id();

    // Assert
    assert!(
        Uuid::parse_str(&id).is_ok(),
        "Generated ID should be a valid UUID"
    );
}

#[test]
fn test_current_timestamp() {
    // Arrange: rely on chrono Utc generator contract

    // Act
    let ts = current_timestamp();

    // Assert
    assert!(
        DateTime::parse_from_rfc3339(&ts).is_ok(),
        "Generated timestamp should be a valid RFC3339 string"
    );
}

#[test]
fn test_cli_output_started() {
    // Arrange
    let out = CliOutput::Started("t-abc-123".to_string());

    // Act
    let formatted = out.to_string();

    // Assert
    assert!(formatted.contains("t-abc-123"));
    assert!(formatted.contains("Started tracking task"));
}

#[test]
fn test_cli_output_stopped() {
    // Arrange
    let out = CliOutput::Stopped;

    // Act
    let formatted = out.to_string();

    // Assert
    assert!(formatted.contains("Stopped all active projects"));
}

#[test]
fn test_cli_output_status_empty() {
    // Arrange
    let out = CliOutput::Status(vec![]);

    // Act
    let formatted = out.to_string();

    // Assert
    assert!(formatted.contains("Count of Concurrent Tracking Threads: 0"));
}

#[test]
fn test_cli_output_status_multiple() {
    // Arrange
    let out = CliOutput::Status(vec!["task-1".to_string(), "task-2".to_string()]);

    // Act
    let formatted = out.to_string();

    // Assert
    assert!(formatted.contains("Count of Concurrent Tracking Threads: 2"));
    assert!(formatted.contains("task-1"));
    assert!(formatted.contains("task-2"));
}

#[test]
fn test_cli_output_success() {
    // Arrange
    let out = CliOutput::Success("Some successful operation".to_string());

    // Act
    let formatted = out.to_string();

    // Assert
    assert!(formatted.contains("Some successful operation"));
    assert!(formatted.contains("✅"));
}

#[test]
fn test_cli_output_json() {
    // Arrange
    let out = CliOutput::Json(r#"{"status":"ok"}"#.to_string());

    // Act
    let formatted = out.to_string();

    // Assert
    assert_eq!(formatted, r#"{"status":"ok"}"#);
}
