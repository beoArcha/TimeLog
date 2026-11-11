use crate::e2e::support::{execute_oxy_with_timeout, TempEnvDir};
use std::time::Duration;

#[test]
fn test_given_missing_explicit_db_in_machine_mode_when_executing_then_exits_3_with_empty_stdout_and_sqlite_init_envelope(
) {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_missing_db_machine");
    let missing_parent = temp_env.path.join("nonexistent_dir");
    let missing_db = missing_parent.join("missing.sqlite");
    let db_str = missing_db.to_string_lossy();

    // When
    let output = execute_oxy_with_timeout(
        &temp_env,
        &["--db", &db_str, "report", "--json"],
        Duration::from_secs(10),
    );

    // Then
    assert_eq!(output.status.code(), Some(3));
    assert!(
        output.stdout.is_empty(),
        "stdout must stay completely empty in machine mode error, got: {}",
        String::from_utf8_lossy(&output.stdout)
    );
    let stderr_str = String::from_utf8_lossy(&output.stderr);
    let json_val: serde_json::Value = serde_json::from_str(&stderr_str)
        .unwrap_or_else(|e| panic!("stderr failed to parse as JSON: {e}\nstderr: {stderr_str}"));
    assert_eq!(json_val["code"], "STO_SQLITE_INIT");
    assert_eq!(json_val["exit_code"], 3);
    assert!(
        !missing_parent.exists(),
        "Parent directory must not be created on validation failure"
    );
    assert!(
        !missing_db.exists(),
        "Database file must not be created on validation failure"
    );
}

#[test]
fn test_given_missing_explicit_db_with_equals_syntax_when_executing_then_behaves_identically() {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_missing_db_equals");
    let missing_parent = temp_env.path.join("nested_folder");
    let missing_db = missing_parent.join("missing.sqlite");
    let flag_arg = format!("--db={}", missing_db.display());

    // When
    let output = execute_oxy_with_timeout(
        &temp_env,
        &[&flag_arg, "report", "--json"],
        Duration::from_secs(10),
    );

    // Then
    assert_eq!(output.status.code(), Some(3));
    assert!(
        output.stdout.is_empty(),
        "stdout must stay completely empty in machine mode error"
    );
    let stderr_str = String::from_utf8_lossy(&output.stderr);
    let json_val: serde_json::Value = serde_json::from_str(&stderr_str)
        .unwrap_or_else(|e| panic!("stderr failed to parse as JSON: {e}\nstderr: {stderr_str}"));
    assert_eq!(json_val["code"], "STO_SQLITE_INIT");
    assert_eq!(json_val["exit_code"], 3);
    assert!(!missing_parent.exists());
    assert!(!missing_db.exists());
}

#[test]
fn test_given_missing_explicit_db_in_human_mode_when_executing_then_exits_3_and_stderr_mentions_path(
) {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_missing_db_human");
    let missing_parent = temp_env.path.join("ghost_dir");
    let missing_db = missing_parent.join("missing.sqlite");
    let db_str = missing_db.to_string_lossy();

    // When
    let output = execute_oxy_with_timeout(
        &temp_env,
        &["--db", &db_str, "report"],
        Duration::from_secs(10),
    );

    // Then
    assert_eq!(output.status.code(), Some(3));
    assert!(
        output.stdout.is_empty(),
        "stdout must stay empty on error in human mode"
    );
    let stderr_str = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr_str.contains("missing.sqlite"),
        "stderr must mention the missing database path: {stderr_str}"
    );
    assert!(
        stderr_str.contains("STO_SQLITE_INIT"),
        "stderr must contain the error code banner: {stderr_str}"
    );
    assert!(!missing_parent.exists());
    assert!(!missing_db.exists());
}

#[test]
fn test_given_existing_database_file_when_executing_command_then_succeeds() {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_existing_db");
    let db_path = temp_env.existing_db_path();
    let db_str = db_path.to_string_lossy();

    // When
    let output = execute_oxy_with_timeout(
        &temp_env,
        &[
            "--db", &db_str, "project", "add", "Alpha", "--color", "blue",
        ],
        Duration::from_secs(10),
    );

    // Then
    assert!(
        output.status.success(),
        "Command against existing DB failed: status={:?}, stdout={}, stderr={}",
        output.status.code(),
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
}

#[test]
fn test_given_missing_db_target_when_executing_db_restore_then_allows_creation_and_restores_backup()
{
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_restore_new_db");
    let source_db = temp_env.existing_db_path();
    let source_db_str = source_db.to_string_lossy();

    // Seed source database with a project
    let add_out = execute_oxy_with_timeout(
        &temp_env,
        &[
            "--db",
            &source_db_str,
            "project",
            "add",
            "Backup Project",
            "--color",
            "green",
        ],
        Duration::from_secs(10),
    );
    assert!(add_out.status.success(), "Failed to seed source db");

    // Create backup file
    let backup_file = temp_env.path.join("backup.sqlite");
    let backup_file_str = backup_file.to_string_lossy();
    let backup_out = execute_oxy_with_timeout(
        &temp_env,
        &["--db", &source_db_str, "db", "backup", &backup_file_str],
        Duration::from_secs(10),
    );
    assert!(
        backup_out.status.success(),
        "Backup command failed: {}",
        String::from_utf8_lossy(&backup_out.stderr)
    );
    assert!(backup_file.exists(), "Backup file must exist");

    // Target database does not exist initially
    let target_db = temp_env.path.join("target_restored.sqlite");
    let target_db_str = target_db.to_string_lossy();
    assert!(
        !target_db.exists(),
        "Target database must not exist before restore"
    );

    // When - restore into target database that does not exist yet
    let restore_out = execute_oxy_with_timeout(
        &temp_env,
        &["--db", &target_db_str, "db", "restore", &backup_file_str],
        Duration::from_secs(10),
    );

    // Then
    assert!(
        restore_out.status.success(),
        "Restore into new DB target failed: status={:?}, stderr={}",
        restore_out.status.code(),
        String::from_utf8_lossy(&restore_out.stderr)
    );
    assert!(
        target_db.exists(),
        "Target database must exist after restore"
    );

    // Verify restored database contents
    let list_out = execute_oxy_with_timeout(
        &temp_env,
        &["--db", &target_db_str, "project", "list", "--json"],
        Duration::from_secs(10),
    );
    assert!(list_out.status.success());
    let list_stdout = String::from_utf8_lossy(&list_out.stdout);
    assert!(
        list_stdout.contains("Backup Project"),
        "Restored database must contain original seeded project: {list_stdout}"
    );
}
