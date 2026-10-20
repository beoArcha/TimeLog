use oxy_flow::common::constants::{APP_NAME, CONFIG, DEFAULT_DB_NAME};
use rusqlite::Connection;
use std::process::Command;

#[test]
fn test_given_compiled_binary_when_invoking_help_flag_then_outputs_usage_text() {
    // Given
    let bin_path = env!("CARGO_BIN_EXE_oxy-flow");

    // When
    let output = Command::new(bin_path)
        .arg("--help")
        .output()
        .expect("Failed to execute oxy-flow binary with --help");

    // Then
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = format!("{}\n{}", stdout, stderr);

    assert!(
        combined.contains("Usage")
            || combined.contains("manage")
            || combined.contains("oxytime-cli"),
        "Expected clap help text in CLI output, got: {}",
        combined
    );
}

#[test]
fn test_given_compiled_binary_when_invoking_invalid_subcommand_then_returns_non_zero_status() {
    // Given
    let bin_path = env!("CARGO_BIN_EXE_oxy-flow");

    // When
    let output = Command::new(bin_path)
        .arg("nonexistent-command-xyz")
        .output()
        .expect("Failed to execute oxy-flow binary");

    // Then
    assert!(!output.status.success() || !output.stderr.is_empty());
}

#[test]
fn test_given_compiled_binary_when_executing_crud_against_sqlite_then_persists_records() {
    // Given
    let bin_path = env!("CARGO_BIN_EXE_oxy-flow");
    let test_uuid = uuid::Uuid::new_v4().to_string();
    let temp_root = std::env::temp_dir().join(format!("oxy_cli_subp_{}", test_uuid));
    let _ = std::fs::create_dir_all(&temp_root);

    // When - Create project via CLI subprocess
    let proj_output = Command::new(bin_path)
        .env("APPDATA", &temp_root)
        .env("AppData", &temp_root)
        .env("HOME", &temp_root)
        .arg("manage")
        .arg("project")
        .arg("create")
        .arg("Subprocess Project")
        .arg("--color")
        .arg("indigo")
        .output()
        .expect("Failed to execute project create via CLI binary subprocess");

    let stdout_str = String::from_utf8_lossy(&proj_output.stdout);
    let stderr_str = String::from_utf8_lossy(&proj_output.stderr);
    assert!(
        proj_output.status.success(),
        "Project create subprocess failed: stdout={}, stderr={}",
        stdout_str,
        stderr_str
    );

    // Then - Verify SQLite database was physically written to disk and has project record
    let db_candidates = [
        temp_root.join(APP_NAME).join(DEFAULT_DB_NAME),
        temp_root.join(CONFIG).join(APP_NAME).join(DEFAULT_DB_NAME),
    ];
    let db_path = db_candidates
        .into_iter()
        .find(|p| p.exists())
        .unwrap_or_else(|| temp_root.join(APP_NAME).join(DEFAULT_DB_NAME));
    assert!(
        db_path.exists(),
        "Expected SQLite database to exist at {:?}",
        db_path
    );

    let conn = Connection::open(&db_path).expect("Failed to open created SQLite file");
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM projects WHERE name = 'Subprocess Project'",
            [],
            |row| row.get(0),
        )
        .expect("Failed to query created project");
    assert_eq!(count, 1, "Expected 1 project record in SQLite database");

    // Clean up temporary test directory
    let _ = std::fs::remove_dir_all(&temp_root);
}
