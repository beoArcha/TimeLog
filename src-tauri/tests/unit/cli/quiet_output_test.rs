use oxyflow_timelog::cli::CliOutput;

#[test]
fn test_given_id_output_when_rendered_then_displays_bare_identifier_without_success_badge() {
    // Arrange
    let output = CliOutput::Id("0f8fad5b-d9cb-469f-a165-8c7d4a1c2b3e".to_string());

    // Act
    let rendered = output.to_string();

    // Assert
    assert_eq!(rendered, "0f8fad5b-d9cb-469f-a165-8c7d4a1c2b3e");
    assert!(!rendered.contains('✅'));
}

#[test]
fn test_given_quiet_mutation_when_built_then_returns_identifier_variant() {
    // Arrange
    let entity_id = "task-42";

    // Act
    let output = CliOutput::mutation(true, entity_id, "Created task with ID: task-42".to_string());

    // Assert
    assert_eq!(output, CliOutput::Id(entity_id.to_string()));
}

#[test]
fn test_given_non_quiet_mutation_when_built_then_returns_success_message() {
    // Arrange
    let message = "Created task with ID: task-42".to_string();

    // Act
    let output = CliOutput::mutation(false, "task-42", message.clone());

    // Assert
    assert_eq!(output, CliOutput::Success(message));
}

#[test]
fn test_given_quiet_list_when_built_then_drops_header_and_status_prefix() {
    // Arrange
    let rows = " • \"Alpha\" [ID: a1]\n • \"Beta\" [ID: b2]\n";

    // Act
    let output = CliOutput::list(true, "📂 Projects:\n", rows);

    // Assert
    let rendered = output.to_string();
    assert_eq!(rendered, " • \"Alpha\" [ID: a1]\n • \"Beta\" [ID: b2]");
    assert!(!rendered.contains("Projects"));
    assert!(!rendered.contains('✅'));
}

#[test]
fn test_given_non_quiet_list_when_built_then_keeps_header_and_rows() {
    // Arrange
    let rows = " • \"Alpha\" [ID: a1]\n";

    // Act
    let output = CliOutput::list(false, "📂 Projects:\n", rows);

    // Assert
    assert!(output.to_string().starts_with("✅ 📂 Projects:"));
    assert!(output.to_string().contains("\"Alpha\""));
}

#[test]
fn test_given_empty_quiet_list_when_rendered_then_output_is_empty() {
    // Arrange
    let output = CliOutput::empty_list(true, "No projects found.");

    // Act
    let rendered = output.to_string();

    // Assert
    assert!(rendered.is_empty());
}

#[test]
fn test_given_empty_non_quiet_list_when_rendered_then_returns_notice() {
    // Arrange
    let output = CliOutput::empty_list(false, "No projects found.");

    // Act
    let rendered = output.to_string();

    // Assert
    assert!(rendered.contains("No projects found."));
}
