use clap::Parser;
use oxyflow_timelog::cli::shared::db_target::{requires_existing_db, validate_db_target_with};
use oxyflow_timelog::cli::{CliArgs, CliError, CliErrorCode};

#[test]
fn test_given_explicit_missing_path_when_evaluating_db_target_then_requires_existence_and_returns_storage_error(
) {
    // Arrange
    let parsed = CliArgs::try_parse_from(["oxy", "--db", "missing.sqlite", "report"]).ok();
    let explicit_db = Some("missing.sqlite");
    let fake_disk = |_path: &std::path::Path| false;

    // Act
    let requires = requires_existing_db(parsed.as_ref(), explicit_db);
    let result = validate_db_target_with(parsed.as_ref(), explicit_db, fake_disk);

    // Assert
    assert!(requires, "explicit path must require existing database");
    match &result {
        Err(CliError::Storage(err)) => {
            assert_eq!(
                result.as_ref().unwrap_err().error_code(),
                CliErrorCode::StoSqliteInit
            );
            let msg = err.to_string();
            assert!(msg.contains("missing.sqlite"));
        }
        other => panic!("Expected Storage error, got: {:?}", other),
    }
}

#[test]
fn test_given_explicit_path_with_db_restore_when_evaluating_db_target_then_allows_creation() {
    // Arrange
    let parsed = CliArgs::try_parse_from([
        "oxy",
        "--db",
        "new.sqlite",
        "db",
        "restore",
        "backup.sqlite",
    ])
    .ok();
    let explicit_db = Some("new.sqlite");
    let fake_disk = |_path: &std::path::Path| false;

    // Act
    let requires = requires_existing_db(parsed.as_ref(), explicit_db);
    let result = validate_db_target_with(parsed.as_ref(), explicit_db, fake_disk);

    // Assert
    assert!(!requires, "db restore must allow database creation");
    assert!(
        result.is_ok(),
        "validation must succeed for db restore even if file is missing"
    );
}

#[test]
fn test_given_no_explicit_path_when_evaluating_db_target_then_no_check_and_succeeds() {
    // Arrange
    let parsed = CliArgs::try_parse_from(["oxy", "report"]).ok();
    let explicit_db = None;
    let fake_disk = |_path: &std::path::Path| false;

    // Act
    let requires = requires_existing_db(parsed.as_ref(), explicit_db);
    let result = validate_db_target_with(parsed.as_ref(), explicit_db, fake_disk);

    // Assert
    assert!(
        !requires,
        "default path must not require existing database check"
    );
    assert!(
        result.is_ok(),
        "validation must succeed when no explicit --db is given"
    );
}

#[test]
fn test_given_first_parse_failure_with_explicit_db_when_evaluating_db_target_then_requires_existence(
) {
    // Arrange
    let parsed: Option<CliArgs> = None;
    let explicit_db = Some("custom.sqlite");
    let fake_disk = |_path: &std::path::Path| false;

    // Act
    let requires = requires_existing_db(parsed.as_ref(), explicit_db);
    let result = validate_db_target_with(parsed.as_ref(), explicit_db, fake_disk);

    // Assert
    assert!(
        requires,
        "unparsed invocation (e.g. mask alias) with explicit --db must require existence"
    );
    assert!(result.is_err());
    assert_eq!(
        result.unwrap_err().error_code(),
        CliErrorCode::StoSqliteInit
    );
}

#[test]
fn test_given_existing_file_with_explicit_db_when_evaluating_db_target_then_succeeds() {
    // Arrange
    let parsed = CliArgs::try_parse_from(["oxy", "--db", "existing.sqlite", "report"]).ok();
    let explicit_db = Some("existing.sqlite");
    let fake_disk = |_path: &std::path::Path| true;

    // Act
    let requires = requires_existing_db(parsed.as_ref(), explicit_db);
    let result = validate_db_target_with(parsed.as_ref(), explicit_db, fake_disk);

    // Assert
    assert!(requires);
    assert!(
        result.is_ok(),
        "validation must succeed when explicit file exists"
    );
}
