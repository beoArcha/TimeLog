use crate::e2e::support::{execute_oxy_with_timeout, TempEnvDir};
use std::time::Duration;

#[test]
fn test_given_invalid_subcommand_in_machine_mode_when_parsing_then_returns_exit_2_with_unknown_command_envelope(
) {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_invalid_subcommand");
    let db = temp_env.existing_db_path();
    let db_str = db.to_string_lossy();

    // When
    let output = execute_oxy_with_timeout(
        &temp_env,
        &["--db", &db_str, "frobnicate", "--json"],
        Duration::from_secs(10),
    );

    // Then
    assert_eq!(output.status.code(), Some(2));
    assert!(
        output.stdout.is_empty(),
        "stdout must stay completely empty in machine mode syntax error, got: {}",
        String::from_utf8_lossy(&output.stdout)
    );
    let stderr_str = String::from_utf8_lossy(&output.stderr);
    let json_val: serde_json::Value = serde_json::from_str(&stderr_str)
        .unwrap_or_else(|e| panic!("stderr failed to parse as JSON: {e}\nstderr: {stderr_str}"));
    assert_eq!(json_val["code"], "CLI_SYNTAX_UNKNOWN_COMMAND");
    assert_eq!(json_val["exit_code"], 2);
}

#[test]
fn test_given_unknown_flag_in_machine_mode_when_parsing_then_returns_exit_2_with_invalid_args_envelope(
) {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_bogus_flag");
    let db = temp_env.existing_db_path();
    let db_str = db.to_string_lossy();

    // When
    let output = execute_oxy_with_timeout(
        &temp_env,
        &["--db", &db_str, "report", "--bogus-flag", "--json"],
        Duration::from_secs(10),
    );

    // Then
    assert_eq!(output.status.code(), Some(2));
    assert!(
        output.stdout.is_empty(),
        "stdout must stay completely empty in machine mode syntax error, got: {}",
        String::from_utf8_lossy(&output.stdout)
    );
    let stderr_str = String::from_utf8_lossy(&output.stderr);
    let json_val: serde_json::Value = serde_json::from_str(&stderr_str)
        .unwrap_or_else(|e| panic!("stderr failed to parse as JSON: {e}\nstderr: {stderr_str}"));
    assert_eq!(json_val["code"], "CLI_SYNTAX_INVALID_ARGS");
    assert_eq!(json_val["exit_code"], 2);
}

#[test]
fn test_given_invalid_subcommand_in_human_mode_when_parsing_then_returns_exit_2_with_non_json_stderr(
) {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_human_subcommand");
    let db = temp_env.existing_db_path();
    let db_str = db.to_string_lossy();

    // When
    let output = execute_oxy_with_timeout(
        &temp_env,
        &["--db", &db_str, "frobnicate"],
        Duration::from_secs(10),
    );

    // Then
    assert_eq!(output.status.code(), Some(2));
    let stderr_str = String::from_utf8_lossy(&output.stderr);
    let parse_result: Result<serde_json::Value, _> = serde_json::from_str(&stderr_str);
    assert!(
        parse_result.is_err(),
        "human mode stderr should not parse as JSON: {}",
        stderr_str
    );
    assert!(
        stderr_str.contains("frobnicate"),
        "human mode stderr should contain subcommand name: {}",
        stderr_str
    );
}

#[test]
fn test_given_help_flag_with_json_when_invoking_then_outputs_help_text_with_exit_0() {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_help_json");

    // When
    let output =
        execute_oxy_with_timeout(&temp_env, &["--help", "--json"], Duration::from_secs(10));

    // Then
    assert_eq!(output.status.code(), Some(0));
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stdout.contains("Usage") || stdout.contains("oxy"),
        "expected usage text in help output: {}",
        stdout
    );
}

#[test]
fn test_given_preset_combined_with_from_in_machine_mode_when_parsing_then_returns_exit_2_with_invalid_args_envelope(
) {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_preset_with_from");
    let db = temp_env.existing_db_path();
    let db_str = db.to_string_lossy();

    // When
    let output = execute_oxy_with_timeout(
        &temp_env,
        &[
            "--db",
            &db_str,
            "log",
            "ls",
            "--today",
            "--from",
            "2026-10-01",
            "--json",
        ],
        Duration::from_secs(10),
    );

    // Then
    assert_eq!(output.status.code(), Some(2));
    assert!(output.stdout.is_empty());
    let stderr_str = String::from_utf8_lossy(&output.stderr);
    let json_val: serde_json::Value = serde_json::from_str(&stderr_str)
        .unwrap_or_else(|e| panic!("stderr failed to parse as JSON: {e}\nstderr: {stderr_str}"));
    assert_eq!(json_val["code"], "CLI_SYNTAX_INVALID_ARGS");
}

#[test]
fn test_given_invalid_timezone_in_machine_mode_when_running_report_then_returns_exit_2() {
    // Given
    let temp_env = TempEnvDir::new("oxy_e2e_invalid_tz");
    let db = temp_env.existing_db_path();
    let db_str = db.to_string_lossy();

    // When
    let output = execute_oxy_with_timeout(
        &temp_env,
        &[
            "--db",
            &db_str,
            "report",
            "--week",
            "--tz",
            "Mars/Olympus",
            "--json",
        ],
        Duration::from_secs(10),
    );

    // Then
    assert_eq!(output.status.code(), Some(2));
    assert!(output.stdout.is_empty());
}
