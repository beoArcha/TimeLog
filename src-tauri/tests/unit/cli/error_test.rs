use oxyflow_timelog::cli::error::{
    BusinessRuleViolation, CliErrorCode, CliErrorEnvelope, CliSyntaxError,
};
use oxyflow_timelog::cli::resolver::{EntityType, ResolveError};
use oxyflow_timelog::cli::shared::constants::{
    EXIT_CODE_CLI_SYNTAX, EXIT_CODE_ENGINE_ERROR, EXIT_CODE_ENTITY_ERROR,
    EXIT_CODE_GENERIC_FAILURE, EXIT_CODE_STORAGE_ERROR,
};
use oxyflow_timelog::cli::CliError;
use oxyflow_timelog::engine::EngineError;
use oxyflow_timelog::persistence::PersistenceError;

#[test]
fn test_given_syntax_error_when_converting_to_envelope_then_maps_to_cli_syntax_and_exit_code_2() {
    // Arrange
    let error = CliError::Syntax(CliSyntaxError::InvalidArgs(
        "Missing required argument --name".to_string(),
    ));

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
    let error = CliError::Syntax(CliSyntaxError::InvalidDuration("3x".to_string()));

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
    let error = CliError::Storage(PersistenceError::Storage(
        "database locked by concurrent process".to_string(),
    ));

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
    let error = CliError::Storage(PersistenceError::Initialization(
        "permission denied".to_string(),
    ));

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
    let error = CliError::Engine(EngineError::ActiveTimerConflict {
        active_task_id: "task-1".to_string(),
    });

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
    let error = CliError::Business(BusinessRuleViolation::Constraint(
        "Project name cannot exceed 100 characters".to_string(),
    ));

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
    let error = CliError::Syntax(CliSyntaxError::InvalidArgs(
        "Invalid flag --foo".to_string(),
    ));
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
    assert_eq!(CliErrorCode::CliSyntaxEmptyId.category(), "syntax");
    assert_eq!(CliErrorCode::DomEntityNotFound.category(), "entity");
    assert_eq!(CliErrorCode::StoSqliteInit.category(), "storage");
    assert_eq!(CliErrorCode::EngTimerConflict.category(), "engine");
    assert_eq!(CliErrorCode::EngOperationFailed.category(), "engine");
    assert_eq!(CliErrorCode::DomBusinessViolation.category(), "business");
    assert_eq!(CliErrorCode::SnkExternalIo.category(), "sink");
    assert_eq!(CliErrorCode::MskAliasNotFound.category(), "mask");
    assert_eq!(CliErrorCode::MskAliasSyntax.category(), "mask");
}

#[test]
fn test_given_missing_mask_alias_when_converting_to_envelope_then_maps_to_syntax_exit_code_2_and_mask_category(
) {
    // Arrange
    let resolve_err = ResolveError::NotFound {
        target: "unknown_mask".to_string(),
        entity_type: EntityType::MaskAlias,
    };
    let error = CliError::Entity(resolve_err);

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "MSK_ALIAS_NOT_FOUND");
    assert_eq!(envelope.category, "mask");
    assert_eq!(envelope.exit_code, EXIT_CODE_CLI_SYNTAX);
}

#[test]
fn test_given_engine_operation_failed_when_converting_to_envelope_then_maps_to_generic_failure_exit_code_1(
) {
    // Arrange
    let error = CliError::Engine(EngineError::OperationFailed(
        "Timer invariant violated".to_string(),
    ));

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "ENG_OPERATION_FAILED");
    assert_eq!(envelope.category, "engine");
    assert_eq!(envelope.exit_code, EXIT_CODE_GENERIC_FAILURE);
}

#[test]
fn test_given_empty_id_when_converting_to_envelope_then_maps_to_empty_id_and_exit_code_2() {
    // Arrange
    let error = CliError::Syntax(CliSyntaxError::EmptyId);

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "CLI_SYNTAX_EMPTY_ID");
    assert_eq!(envelope.category, "syntax");
    assert_eq!(envelope.exit_code, EXIT_CODE_CLI_SYNTAX);
}

#[test]
fn test_given_mask_syntax_error_when_converting_to_envelope_then_maps_to_mask_syntax_and_exit_code_2(
) {
    // Arrange
    let error = CliError::Syntax(CliSyntaxError::MaskSyntax(
        "Mask template cannot reference itself".to_string(),
    ));

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "MSK_ALIAS_SYNTAX");
    assert_eq!(envelope.category, "mask");
    assert_eq!(envelope.exit_code, EXIT_CODE_CLI_SYNTAX);
}

#[test]
fn test_given_machine_mode_when_converting_to_envelope_then_omits_user_field_in_serialized_json() {
    // Arrange
    let error = CliError::Syntax(CliSyntaxError::EmptyId);

    // Act
    let envelope = error.to_machine_envelope();
    let json_str = serde_json::to_string(&envelope).expect("serialization failed");

    // Assert
    assert!(envelope.user.is_none());
    assert!(!json_str.contains("\"user\""));
    assert!(json_str.contains("\"code\":\"CLI_SYNTAX_EMPTY_ID\""));
    assert!(json_str.contains("\"exit_code\":2"));
}

#[test]
fn test_given_serde_json_error_when_converting_to_cli_error_then_maps_to_storage_serialization() {
    // Arrange
    let raw_json = "{ invalid_json: ";
    let serde_err = serde_json::from_str::<serde_json::Value>(raw_json).unwrap_err();

    // Act
    let cli_err: CliError = serde_err.into();

    // Assert
    assert_eq!(cli_err.exit_code(), EXIT_CODE_STORAGE_ERROR);
    match cli_err {
        CliError::Storage(PersistenceError::Serialization(_)) => (),
        other => panic!("expected CliError::Storage(Serialization), got {:?}", other),
    }
}

#[test]
fn test_given_stage_a_before_db_open_when_building_envelope_then_uses_explicit_en_fallback() {
    use oxyflow_timelog::cli::build_error_envelope;

    let error = CliError::Storage(PersistenceError::Storage("Connection refused".to_string()));

    // Stage A: persistence is None
    let envelope = build_error_envelope(&error, true, None);
    assert_eq!(envelope.code, "STO_SQLITE_QUERY");
    assert_eq!(envelope.exit_code, 3);
    assert!(envelope.user.is_none()); // In machine mode, user is None

    // Human mode Stage A
    let envelope_human = build_error_envelope(&error, false, None);
    assert_eq!(envelope_human.code, "STO_SQLITE_QUERY");
    assert!(envelope_human.user.is_some());
    assert_eq!(envelope_human.user.unwrap().locale, "en");
}

#[test]
fn test_given_stage_b_and_c_when_building_envelope_then_preserves_primary_error_and_handles_locale_failures(
) {
    use crate::shared::test_db::setup_persistence_test;
    use oxyflow_timelog::cli::{build_error_envelope, resolve_envelope_locale};
    use oxyflow_timelog::persistence::Persistence;

    let (_conn, config, _temp_dir) = setup_persistence_test("unit_error_envelope_lifecycle");
    let persistence = Persistence::new(&config).expect("failed to create persistence");

    // Stage B: persistence is available and cli_machine_locale is configured to "ja"
    persistence
        .cli
        .set_config_value("cli_machine_locale", "ja")
        .unwrap();

    let primary_error = CliError::Syntax(CliSyntaxError::EmptyId);
    let resolved_b = resolve_envelope_locale(true, Some(&persistence));
    assert_eq!(resolved_b, Some("ja".to_string()));

    let envelope_b = build_error_envelope(&primary_error, true, Some(&persistence));
    assert_eq!(envelope_b.code, "CLI_SYNTAX_EMPTY_ID");
    assert_eq!(envelope_b.exit_code, 2);

    // Stage C: persistence is available, but locale config has corrupted value
    persistence
        .cli
        .set_config_value("cli_machine_locale", "corrupted_val")
        .unwrap();

    // Locale resolution failure must log error, return "en" fallback, and preserve primary error
    let resolved_c = resolve_envelope_locale(true, Some(&persistence));
    assert_eq!(resolved_c, Some("en".to_string()));

    let envelope_c = build_error_envelope(&primary_error, true, Some(&persistence));
    assert_eq!(envelope_c.code, "CLI_SYNTAX_EMPTY_ID");
    assert_eq!(envelope_c.exit_code, 2);
}
