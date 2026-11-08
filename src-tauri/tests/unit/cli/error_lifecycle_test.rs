use crate::shared::test_db::setup_persistence_test;
use oxyflow_timelog::cli::error::{CliError, CliSyntaxError};
use oxyflow_timelog::cli::{
    build_error_envelope, init_cli_logger, resolve_envelope_locale, resolve_machine_locale,
};
use oxyflow_timelog::persistence::{Persistence, PersistenceError};

#[test]
fn test_given_stage_a_before_db_open_when_building_envelope_then_uses_explicit_en_fallback() {
    // Arrange
    let error = CliError::Storage(PersistenceError::Storage("Connection refused".to_string()));

    // Act - Stage A: persistence is None, machine mode
    let envelope_machine = build_error_envelope(&error, true, None);

    // Assert
    assert_eq!(envelope_machine.code, "STO_SQLITE_QUERY");
    assert_eq!(envelope_machine.exit_code, 3);
    assert!(envelope_machine.user.is_none());

    // Act - Human mode Stage A
    let envelope_human = build_error_envelope(&error, false, None);

    // Assert
    assert_eq!(envelope_human.code, "STO_SQLITE_QUERY");
    assert!(envelope_human.user.is_some());
    assert_eq!(envelope_human.user.unwrap().locale, "en");
}

#[test]
fn test_given_stage_b_and_c_when_building_envelope_then_preserves_primary_error_and_handles_locale_failures(
) {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("unit_error_envelope_lifecycle");
    let persistence = Persistence::new(&config).expect("failed to create persistence");

    // Stage B: persistence is available and cli_machine_locale is configured to "ja"
    persistence
        .cli
        .set_config_value("cli_machine_locale", "ja")
        .expect("set config value failed");

    let primary_error = CliError::Syntax(CliSyntaxError::EmptyId);

    // Act & Assert - Stage B
    let resolved_b = resolve_envelope_locale(true, Some(&persistence));
    assert_eq!(resolved_b, Some("ja".to_string()));

    let envelope_b = build_error_envelope(&primary_error, true, Some(&persistence));
    assert_eq!(envelope_b.code, "CLI_SYNTAX_EMPTY_ID");
    assert_eq!(envelope_b.exit_code, 2);

    // Stage C: persistence is available, but locale config has corrupted value
    persistence
        .cli
        .set_config_value("cli_machine_locale", "corrupted_val")
        .expect("set config value failed");

    // Act & Assert - Stage C
    let resolved_c = resolve_envelope_locale(true, Some(&persistence));
    assert_eq!(resolved_c, Some("en".to_string()));

    let envelope_c = build_error_envelope(&primary_error, true, Some(&persistence));
    assert_eq!(envelope_c.code, "CLI_SYNTAX_EMPTY_ID");
    assert_eq!(envelope_c.exit_code, 2);
}

#[test]
fn test_given_sqlite_storage_failure_during_locale_resolution_when_building_envelope_then_logs_and_falls_back_to_en_preserving_primary_error(
) {
    // Arrange
    init_cli_logger();

    let (conn, config, _temp_dir) =
        setup_persistence_test("unit_error_envelope_sqlite_storage_failure");
    let persistence = Persistence::new(&config).expect("failed to create persistence");

    // Simulate SQLite operational failure by dropping config table
    conn.execute("DROP TABLE config", [])
        .expect("drop table failed");

    // Act: verify that resolve_machine_locale directly fails with CliError::Storage
    let res = resolve_machine_locale(&persistence);

    // Assert
    assert!(res.is_err());
    let err = res.unwrap_err();
    match err {
        CliError::Storage(_) => (),
        other => panic!("expected CliError::Storage, got {:?}", other),
    }

    let primary_error = CliError::Syntax(CliSyntaxError::EmptyId);

    // Verify resolve_envelope_locale logs error and falls back safely to "en"
    let resolved_locale = resolve_envelope_locale(true, Some(&persistence));
    assert_eq!(resolved_locale, Some("en".to_string()));

    // Verify build_error_envelope preserves primary error code and exit code
    let envelope = build_error_envelope(&primary_error, true, Some(&persistence));
    assert_eq!(envelope.code, "CLI_SYNTAX_EMPTY_ID");
    assert_eq!(envelope.exit_code, 2);
}
