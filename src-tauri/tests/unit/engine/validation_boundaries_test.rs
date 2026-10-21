use crate::shared::builders::ProjectBuilder;
use crate::shared::test_db::setup_persistence_test;
use chrono::Utc;
use oxy_flow::engine::validation::{
    sanitize_text, MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH, MAX_TAG_LENGTH,
};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_sanitize_text_strips_control_characters_and_handles_newlines() {
    // Arrange
    let dirty = "Hello\x00\x07\x1BWorld\x7F!";
    let multiline = "Line 1\nLine 2\tTab\x00End";

    // Act
    let sanitized_inline = sanitize_text(dirty, false);
    let sanitized_multiline = sanitize_text(multiline, true);

    // Assert
    assert_eq!(sanitized_inline, "HelloWorld!");
    assert_eq!(sanitized_multiline, "Line 1\nLine 2\tTabEnd");
}

#[test]
fn test_validate_project_name_rejects_empty_and_whitespace_only() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("engine_val_empty");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    // Act & Assert
    assert!(engine.validate_project_name("", None).is_err());
    assert!(engine.validate_project_name("   \t  ", None).is_err());
    assert!(engine.validate_project_name("\x00\x1F", None).is_err());
}

#[test]
fn test_validate_project_name_rejects_names_exceeding_max_length() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("engine_val_long");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    let overly_long = "A".repeat(MAX_NAME_LENGTH + 1);
    let exact_limit = "A".repeat(MAX_NAME_LENGTH);

    // Act & Assert
    assert!(engine.validate_project_name(&overly_long, None).is_err());
    assert!(engine.validate_project_name(&exact_limit, None).is_ok());
}

#[test]
fn test_validate_project_name_rejects_case_insensitive_duplicates() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("engine_val_dup");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_alpha")
        .with_name("Alpha Project")
        .with_color("blue")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.projects.create(project).unwrap();

    // Act & Assert
    assert!(engine.validate_project_name("alpha project", None).is_err());
    assert!(engine
        .validate_project_name("ALPHA PROJECT", Some("p_alpha"))
        .is_ok());
    assert!(engine.validate_project_name("Beta Project", None).is_ok());
}

#[test]
fn test_validate_task_name_enforces_non_empty_and_max_length() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("engine_val_task");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    let overly_long = "T".repeat(MAX_NAME_LENGTH + 1);
    let exact_limit = "T".repeat(MAX_NAME_LENGTH);

    // Act & Assert
    assert!(engine.validate_task_name("").is_err());
    assert!(engine.validate_task_name("   ").is_err());
    assert!(engine.validate_task_name(&overly_long).is_err());
    assert!(engine.validate_task_name(&exact_limit).is_ok());
    assert_eq!(
        engine.validate_task_name("  Clean Task\x00  ").unwrap(),
        "Clean Task"
    );
}

#[test]
fn test_validate_tag_enforces_boundaries() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("engine_val_tag");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    let overly_long_tag = "t".repeat(MAX_TAG_LENGTH + 1);

    // Act & Assert
    assert!(engine.validate_tag("").is_err());
    assert!(engine.validate_tag("   ").is_err());
    assert!(engine.validate_tag(&overly_long_tag).is_err());
    assert_eq!(engine.validate_tag("  feature-v1  ").unwrap(), "feature-v1");
}

#[test]
fn test_validate_description_enforces_length_and_formatting() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("engine_val_desc");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);
    let overly_long_desc = "D".repeat(MAX_DESCRIPTION_LENGTH + 1);

    // Act & Assert
    assert!(engine.validate_description(None).unwrap().is_none());
    assert!(engine.validate_description(Some("   ")).unwrap().is_none());
    assert!(engine
        .validate_description(Some(&overly_long_desc))
        .is_err());
    assert_eq!(
        engine
            .validate_description(Some("  Line 1\nLine 2\tTab  "))
            .unwrap(),
        Some("Line 1\nLine 2\tTab".to_string())
    );
}
