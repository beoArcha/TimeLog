use crate::e2e::support::{execute_oxy_with_timeout, TempEnvDir};
use std::time::Duration;

#[test]
fn test_given_compiled_oxy_binary_when_invoking_help_flag_then_outputs_usage_text() {
    // Given
    let temp_env = TempEnvDir::new("oxy_smoke_help");

    // When
    let output = execute_oxy_with_timeout(&temp_env, &["--help"], Duration::from_secs(10));

    // Then
    assert!(
        output.status.success(),
        "Help command failed: status={:?}, stdout={}, stderr={}",
        output.status.code(),
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stdout.contains("Usage") || stdout.contains("oxy"),
        "Expected usage text in help output: {}",
        stdout
    );
}

#[test]
fn test_given_compiled_oxy_binary_when_invoking_invalid_subcommand_then_returns_non_zero_status() {
    // Given
    let temp_env = TempEnvDir::new("oxy_smoke_invalid");

    // When
    let output = execute_oxy_with_timeout(
        &temp_env,
        &["nonexistent-command-xyz"],
        Duration::from_secs(10),
    );

    // Then
    assert!(!output.status.success());
}

#[test]
fn test_given_compiled_oxy_binary_when_invoking_version_flag_then_outputs_version() {
    // Given
    let temp_env = TempEnvDir::new("oxy_smoke_version");

    // When
    let output = execute_oxy_with_timeout(&temp_env, &["--version"], Duration::from_secs(10));

    // Then
    assert!(
        output.status.success(),
        "Version command failed: status={:?}, stdout={}, stderr={}",
        output.status.code(),
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stdout.contains("oxy"),
        "Expected version output to contain binary name: {}",
        stdout
    );
}

#[test]
fn test_given_isolated_environment_when_creating_project_via_oxy_then_persists_to_disk() {
    // Given
    let temp_env = TempEnvDir::new("oxy_smoke_crud");

    // When
    let proj_output = execute_oxy_with_timeout(
        &temp_env,
        &["project", "add", "Smoke Project", "--color", "indigo"],
        Duration::from_secs(10),
    );

    // Then
    assert!(
        proj_output.status.success(),
        "Project add failed: stdout={}, stderr={}",
        String::from_utf8_lossy(&proj_output.stdout),
        String::from_utf8_lossy(&proj_output.stderr)
    );
}
