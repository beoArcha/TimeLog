use oxy_flow::cli::CliOutput;

#[test]
fn test_given_json_output_when_formatted_then_emits_raw_parseable_json_without_success_badge() {
    // Arrange
    let json_payload = "{\"status\":\"ok\",\"action\":\"created\",\"id\":\"proj-123\"}";
    let output = CliOutput::Json(json_payload.to_string());

    // Act
    let rendered = output.to_string();

    // Assert
    assert_eq!(rendered, json_payload);
    assert!(!rendered.contains('✅'));
    let parsed: Result<serde_json::Value, _> = serde_json::from_str(&rendered);
    assert!(parsed.is_ok());
}

#[test]
fn test_given_success_output_when_formatted_then_includes_success_badge() {
    // Arrange
    let message = "Operation completed successfully";
    let output = CliOutput::Success(message.to_string());

    // Act
    let rendered = output.to_string();

    // Assert
    assert!(rendered.contains('✅'));
    assert!(rendered.contains(message));
}

#[test]
fn test_given_stopped_output_when_formatted_then_emits_stopped_message() {
    // Arrange
    let output = CliOutput::Stopped;

    // Act
    let rendered = output.to_string();

    // Assert
    assert!(rendered.contains("⏹"));
}

#[test]
fn test_given_started_output_when_formatted_then_emits_started_message_with_id() {
    // Arrange
    let task_id = "task-42";
    let output = CliOutput::Started(task_id.to_string());

    // Act
    let rendered = output.to_string();

    // Assert
    assert!(rendered.contains("▶"));
    assert!(rendered.contains(task_id));
}

#[test]
fn test_given_status_output_when_formatted_then_emits_active_tasks() {
    // Arrange
    let active_tasks = vec!["task-1".to_string(), "task-2".to_string()];
    let output = CliOutput::Status(active_tasks);

    // Act
    let rendered = output.to_string();

    // Assert
    assert!(rendered.contains("task-1"));
    assert!(rendered.contains("task-2"));
}
