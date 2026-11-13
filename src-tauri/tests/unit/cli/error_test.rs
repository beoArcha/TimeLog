use oxyflow_timelog::cli::error::{
    BusinessRuleViolation, CliErrorCandidate, CliErrorCode, CliErrorDetails, CliErrorEnvelope,
    CliSyntaxError,
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
        candidates: vec![
            CliErrorCandidate {
                id: "p1".to_string(),
                name: "Backend API".to_string(),
            },
            CliErrorCandidate {
                id: "p2".to_string(),
                name: "Backend Worker".to_string(),
            },
        ],
    };
    let error = CliError::Entity(resolve_err);

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "DOM_ENTITY_AMBIGUOUS");
    assert_eq!(envelope.category, "entity");
    assert_eq!(envelope.exit_code, EXIT_CODE_ENTITY_ERROR);
    let details = envelope
        .details
        .as_ref()
        .expect("details should be present");
    let candidates = details
        .candidates
        .as_ref()
        .expect("candidates should be present");
    assert_eq!(candidates.len(), 2);
    assert_eq!(candidates[0].id, "p1");
    assert_eq!(candidates[0].name, "Backend API");
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
    assert_eq!(CliErrorCode::SnkSerialization.category(), "sink");
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
fn test_given_envelope_without_details_when_serialized_then_details_field_is_omitted() {
    // Arrange
    let envelope = CliErrorEnvelope::new(
        CliErrorCode::DomEntityNotFound,
        4,
        "Target not found".to_string(),
        None,
    );

    // Act
    let json_str = serde_json::to_string(&envelope).expect("serialization failed");

    // Assert
    assert!(!json_str.contains("\"details\""));
}

#[test]
fn test_given_envelope_with_empty_details_when_serialized_then_details_field_is_omitted() {
    // Arrange
    let envelope = CliErrorEnvelope::new(
        CliErrorCode::DomEntityNotFound,
        4,
        "Target not found".to_string(),
        None,
    )
    .with_details(Some(CliErrorDetails::default()));

    // Act
    let json_str = serde_json::to_string(&envelope).expect("serialization failed");

    // Assert
    assert!(!json_str.contains("\"details\""));
}

#[test]
fn test_given_envelope_with_candidates_when_serialized_then_omits_absent_detail_fields() {
    // Arrange
    let details = CliErrorDetails {
        candidates: Some(vec![
            CliErrorCandidate {
                id: "t1".to_string(),
                name: "Task Alpha".to_string(),
            },
            CliErrorCandidate {
                id: "t2".to_string(),
                name: "Task Beta".to_string(),
            },
        ]),
        ..Default::default()
    };
    let envelope = CliErrorEnvelope::new(
        CliErrorCode::DomEntityAmbiguous,
        4,
        "Ambiguous match".to_string(),
        None,
    )
    .with_details(Some(details));

    // Act
    let json_str = serde_json::to_string(&envelope).expect("serialization failed");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("deserialization failed");

    // Assert
    assert!(val.get("details").is_some());
    let details_val = &val["details"];
    assert!(details_val.get("candidates").is_some());
    assert!(details_val.get("suggestion").is_none());
    assert!(details_val.get("field").is_none());
    assert!(details_val.get("value").is_none());
    assert_eq!(details_val["candidates"].as_array().unwrap().len(), 2);
    assert_eq!(details_val["candidates"][0]["id"], "t1");
    assert_eq!(details_val["candidates"][0]["name"], "Task Alpha");
}

#[test]
fn test_given_envelope_with_suggestion_when_serialized_then_omits_absent_detail_fields() {
    // Arrange
    let details = CliErrorDetails {
        suggestion: Some(CliErrorCandidate {
            id: "t42".to_string(),
            name: "Suggested Task".to_string(),
        }),
        ..Default::default()
    };
    let envelope = CliErrorEnvelope::new(
        CliErrorCode::DomEntityDidYouMean,
        4,
        "Did you mean".to_string(),
        None,
    )
    .with_details(Some(details));

    // Act
    let json_str = serde_json::to_string(&envelope).expect("serialization failed");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("deserialization failed");

    // Assert
    let details_val = &val["details"];
    assert!(details_val.get("candidates").is_none());
    assert!(details_val.get("suggestion").is_some());
    assert!(details_val.get("field").is_none());
    assert!(details_val.get("value").is_none());
    assert_eq!(details_val["suggestion"]["id"], "t42");
    assert_eq!(details_val["suggestion"]["name"], "Suggested Task");
}

#[test]
fn test_given_envelope_with_field_and_value_when_serialized_then_omits_absent_detail_fields() {
    // Arrange
    let details = CliErrorDetails {
        field: Some("--format".to_string()),
        value: Some("yaml".to_string()),
        ..Default::default()
    };
    let envelope = CliErrorEnvelope::new(
        CliErrorCode::CliSyntaxInvalidArgs,
        2,
        "Invalid format".to_string(),
        None,
    )
    .with_details(Some(details));

    // Act
    let json_str = serde_json::to_string(&envelope).expect("serialization failed");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("deserialization failed");

    // Assert
    let details_val = &val["details"];
    assert!(details_val.get("candidates").is_none());
    assert!(details_val.get("suggestion").is_none());
    assert_eq!(details_val["field"], "--format");
    assert_eq!(details_val["value"], "yaml");
}

#[test]
fn test_given_did_you_mean_error_when_converting_to_envelope_then_populates_suggestion_details() {
    // Arrange
    let resolve_err = ResolveError::DidYouMean {
        target: "bil".to_string(),
        entity_type: EntityType::Task,
        suggestion: "Billing".to_string(),
        candidate_id: "t_bil".to_string(),
    };
    let error = CliError::Entity(resolve_err);

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "DOM_ENTITY_DID_YOU_MEAN");
    assert_eq!(envelope.exit_code, 4);
    let details = envelope.details.expect("details must be present");
    let suggestion = details.suggestion.expect("suggestion must be present");
    assert_eq!(suggestion.id, "t_bil");
    assert_eq!(suggestion.name, "Billing");
    assert!(details.candidates.is_none());
    assert!(details.field.is_none());
    assert!(details.value.is_none());
}

#[test]
fn test_given_invalid_argument_syntax_error_when_converting_to_envelope_then_populates_field_and_value(
) {
    // Arrange
    let error = CliError::Syntax(CliSyntaxError::InvalidArgument {
        message: "Invalid value 'xyz' for flag --mode".to_string(),
        field: Some("--mode".to_string()),
        value: Some("xyz".to_string()),
    });

    // Act
    let envelope = error.to_envelope(None);

    // Assert
    assert_eq!(envelope.code, "CLI_SYNTAX_INVALID_ARGS");
    assert_eq!(envelope.exit_code, 2);
    let details = envelope.details.expect("details must be present");
    assert_eq!(details.field.as_deref(), Some("--mode"));
    assert_eq!(details.value.as_deref(), Some("xyz"));
    assert!(details.candidates.is_none());
    assert!(details.suggestion.is_none());
}
