use oxy_flow::cli::error::{CliErrorCode, CliErrorEnvelope};
use oxy_flow::cli::resolver::{EntityType, ResolveError};
use oxy_flow::cli::shared::constants::{
    EXIT_CODE_CLI_SYNTAX, EXIT_CODE_ENGINE_ERROR, EXIT_CODE_ENTITY_ERROR,
    EXIT_CODE_GENERIC_FAILURE, EXIT_CODE_STORAGE_ERROR,
};
use oxy_flow::cli::CliError;

#[test]
fn test_given_syntax_error_when_converting_to_envelope_then_maps_to_cli_syntax_and_exit_code_2() {
    // Arrange
    let error = CliError::Syntax("Missing required argument --name".to_string());

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "CLI_SYNTAX_INVALID_ARGS");
    assert_eq!(envelope.category, "syntax");
    assert_eq!(envelope.exit_code, EXIT_CODE_CLI_SYNTAX);
    assert_eq!(envelope.technical, "Missing required argument --name");
    assert!(envelope.user.is_some());
    let user_msg = envelope.user.unwrap();
    assert_eq!(user_msg.locale, "en");
    assert!(user_msg.remediation.is_some());
}

#[test]
fn test_given_duration_syntax_error_when_converting_to_envelope_then_maps_to_invalid_duration_code()
{
    // Arrange
    let error = CliError::Syntax("Invalid duration format: 3x".to_string());

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "CLI_SYNTAX_INVALID_DURATION");
    assert_eq!(envelope.category, "syntax");
    assert_eq!(envelope.exit_code, EXIT_CODE_CLI_SYNTAX);
}

#[test]
fn test_given_not_found_entity_when_converting_to_envelope_then_maps_to_dom_entity_not_found_and_exit_code_4(
) {
    // Arrange
    let resolve_err = ResolveError::NotFound {
        target: "non-existent-task".to_string(),
        entity_type: EntityType::Task,
    };
    let error = CliError::Entity(resolve_err);

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "DOM_ENTITY_NOT_FOUND");
    assert_eq!(envelope.category, "entity");
    assert_eq!(envelope.exit_code, EXIT_CODE_ENTITY_ERROR);
    assert!(envelope.technical.contains("not found"));
    let user_msg = envelope.user.expect("expected user message in envelope");
    assert!(user_msg.remediation.is_some());
}

#[test]
fn test_given_did_you_mean_entity_when_converting_to_envelope_then_includes_suggestion_and_candidate_remediation(
) {
    // Arrange
    let resolve_err = ResolveError::DidYouMean {
        target: "auth-tak".to_string(),
        entity_type: EntityType::Task,
        suggestion: "auth-task".to_string(),
        candidate_id: "task-uuid-123".to_string(),
    };
    let error = CliError::Entity(resolve_err);

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "DOM_ENTITY_DID_YOU_MEAN");
    assert_eq!(envelope.category, "entity");
    assert_eq!(envelope.exit_code, EXIT_CODE_ENTITY_ERROR);
    let user_msg = envelope.user.expect("expected user message");
    assert_eq!(user_msg.suggestion.as_deref(), Some("auth-task"));
    assert!(user_msg
        .remediation
        .expect("expected remediation")
        .contains("task-uuid-123"));
}

#[test]
fn test_given_ambiguous_entity_when_converting_to_envelope_then_maps_to_dom_entity_ambiguous() {
    // Arrange
    let resolve_err = ResolveError::AmbiguousMatch {
        target: "backend".to_string(),
        entity_type: EntityType::Project,
        candidates: vec!["Backend API".to_string(), "Backend Worker".to_string()],
    };
    let error = CliError::Entity(resolve_err);

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "DOM_ENTITY_AMBIGUOUS");
    assert_eq!(envelope.category, "entity");
    assert_eq!(envelope.exit_code, EXIT_CODE_ENTITY_ERROR);
}

#[test]
fn test_given_storage_error_when_converting_to_envelope_then_maps_to_sto_sqlite_and_exit_code_3() {
    // Arrange
    let error = CliError::Storage("database locked by concurrent process".to_string());

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "STO_SQLITE_QUERY");
    assert_eq!(envelope.category, "storage");
    assert_eq!(envelope.exit_code, EXIT_CODE_STORAGE_ERROR);
    assert!(envelope.technical.contains("database locked"));
}

#[test]
fn test_given_storage_init_error_when_converting_to_envelope_then_maps_to_sto_sqlite_init() {
    // Arrange
    let error = CliError::Storage("Storage Initialization failed: permission denied".to_string());

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "STO_SQLITE_INIT");
    assert_eq!(envelope.category, "storage");
    assert_eq!(envelope.exit_code, EXIT_CODE_STORAGE_ERROR);
}

#[test]
fn test_given_engine_error_when_converting_to_envelope_then_maps_to_eng_timer_and_exit_code_5() {
    // Arrange
    let error = CliError::Engine("Timer active on conflicting thread".to_string());

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "ENG_TIMER_CONFLICT");
    assert_eq!(envelope.category, "engine");
    assert_eq!(envelope.exit_code, EXIT_CODE_ENGINE_ERROR);
}

#[test]
fn test_given_business_error_when_converting_to_envelope_then_maps_to_dom_business_and_exit_code_1()
{
    // Arrange
    let error = CliError::Business("Project name cannot exceed 100 characters".to_string());

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "DOM_BUSINESS_VIOLATION");
    assert_eq!(envelope.category, "business");
    assert_eq!(envelope.exit_code, EXIT_CODE_GENERIC_FAILURE);
}

#[test]
fn test_given_envelope_when_serialized_to_json_then_produces_deterministic_machine_schema() {
    // Arrange
    let error = CliError::Syntax("Invalid flag --foo".to_string());
    let envelope = error.to_envelope(Some("en"));

    // Act
    let json_str = serde_json::to_string(&envelope).expect("serialization failed");
    let parsed: CliErrorEnvelope = serde_json::from_str(&json_str).expect("deserialization failed");

    // Assert
    assert_eq!(parsed.code, "CLI_SYNTAX_INVALID_ARGS");
    assert_eq!(parsed.category, "syntax");
    assert_eq!(parsed.exit_code, 2);
    assert_eq!(parsed.technical, "Invalid flag --foo");
    assert!(json_str.contains("\"code\":\"CLI_SYNTAX_INVALID_ARGS\""));
    assert!(json_str.contains("\"exit_code\":2"));
}

#[test]
fn test_given_cli_error_codes_when_category_inspected_then_matches_namespace() {
    // Arrange & Act & Assert
    assert_eq!(CliErrorCode::CliSyntaxInvalidArgs.category(), "syntax");
    assert_eq!(CliErrorCode::DomEntityNotFound.category(), "entity");
    assert_eq!(CliErrorCode::StoSqliteInit.category(), "storage");
    assert_eq!(CliErrorCode::EngTimerConflict.category(), "engine");
    assert_eq!(CliErrorCode::DomBusinessViolation.category(), "business");
    assert_eq!(CliErrorCode::SnkExternalIo.category(), "sink");
    assert_eq!(CliErrorCode::MskAliasNotFound.category(), "mask");
}
