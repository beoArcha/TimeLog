use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::error::CliErrorCode;
use oxy_flow::cli::shared::constants::{EXIT_CODE_CLI_SYNTAX, EXIT_CODE_ENTITY_ERROR};
use oxy_flow::cli::{handle_cli, CliArgs, CliError};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use rusqlite::Connection;

fn setup(db_name: &str) -> (Persistence, Connection, crate::shared::test_db::TempCsvDir) {
    let (conn, config, temp_dir) = setup_persistence_test(db_name);
    let persistence = Persistence::new(&config).expect("failed to create persistence layer");

    let project = ProjectBuilder::new()
        .with_id("p-core")
        .with_name("Core Infrastructure")
        .build();
    let task1 = TaskBuilder::new()
        .with_id("t-auth-01")
        .with_project_id("p-core")
        .with_name("OAuth2 Service")
        .build();
    let task2 = TaskBuilder::new()
        .with_id("t-mail-02")
        .with_project_id("p-core")
        .with_name("Email Service")
        .build();

    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task1).unwrap();
    persistence.tasks.create(task2).unwrap();

    (persistence, conn, temp_dir)
}

#[test]
fn test_given_non_existent_target_when_start_invoked_then_returns_not_found_envelope_with_exit_code_4(
) {
    // Given
    let (persistence, _conn, _temp) = setup("test_error_not_found");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "start", "completely-unknown-target"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(matches!(err, CliError::Entity(_)));
    assert_eq!(err.exit_code(), EXIT_CODE_ENTITY_ERROR);

    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "DOM_ENTITY_NOT_FOUND");
    assert_eq!(envelope.category, "entity");
    assert_eq!(envelope.exit_code, EXIT_CODE_ENTITY_ERROR);
    assert!(envelope.technical.contains("completely-unknown-target"));
}

#[test]
fn test_given_typo_target_when_start_invoked_then_returns_did_you_mean_envelope_with_suggestion() {
    // Given
    let (persistence, _conn, _temp) = setup("test_error_did_you_mean");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "start", "OAuth2 Srevice"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.error_code(), CliErrorCode::DomEntityDidYouMean);

    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "DOM_ENTITY_DID_YOU_MEAN");
    assert_eq!(envelope.exit_code, EXIT_CODE_ENTITY_ERROR);
    let user_msg = envelope.user.expect("expected user message in envelope");
    assert_eq!(user_msg.suggestion.as_deref(), Some("OAuth2 Service"));
    assert!(user_msg
        .remediation
        .expect("expected remediation")
        .contains("t-auth-01"));
}

#[test]
fn test_given_ambiguous_target_when_start_invoked_then_returns_ambiguous_envelope() {
    // Given
    let (persistence, _conn, _temp) = setup("test_error_ambiguous");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "start", "Service"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.error_code(), CliErrorCode::DomEntityAmbiguous);

    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "DOM_ENTITY_AMBIGUOUS");
    assert_eq!(envelope.exit_code, EXIT_CODE_ENTITY_ERROR);
    let user_msg = envelope.user.expect("expected user message in envelope");
    assert!(user_msg.message.contains("Ambiguous"));
}

#[test]
fn test_given_missing_target_and_no_active_logs_when_start_invoked_then_returns_syntax_envelope() {
    // Given
    let (persistence, _conn, _temp) = setup("test_error_missing_target");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "start"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(matches!(err, CliError::Syntax(_)));
    assert_eq!(err.exit_code(), EXIT_CODE_CLI_SYNTAX);

    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "CLI_SYNTAX_INVALID_ARGS");
    assert_eq!(envelope.category, "syntax");
    assert_eq!(envelope.exit_code, EXIT_CODE_CLI_SYNTAX);
}
