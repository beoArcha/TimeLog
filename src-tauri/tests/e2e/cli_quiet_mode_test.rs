use crate::e2e::support::{execute_oxy_with_timeout, TempEnvDir};
use std::time::Duration;

const OXY_TIMEOUT: Duration = Duration::from_secs(20);

#[test]
fn test_given_fresh_database_when_task_add_quiet_then_stdout_is_exactly_one_uuid_line_and_stderr_is_empty(
) {
    // Given
    let temp_env = TempEnvDir::new("oxy_quiet_task_add");
    let project =
        execute_oxy_with_timeout(&temp_env, &["project", "add", "Quiet Project"], OXY_TIMEOUT);
    assert!(
        project.status.success(),
        "project setup failed: stderr={}",
        String::from_utf8_lossy(&project.stderr)
    );

    // When
    let output =
        execute_oxy_with_timeout(&temp_env, &["task", "add", "Quiet Task", "-q"], OXY_TIMEOUT);

    // Then
    assert!(
        output.status.success(),
        "quiet task add failed: stderr={}",
        String::from_utf8_lossy(&output.stderr)
    );
    let stdout = String::from_utf8_lossy(&output.stdout);
    let identifier = stdout
        .strip_suffix('\n')
        .expect("quiet stdout must end with a single newline");
    assert!(
        !identifier.contains('\n'),
        "quiet stdout must be one line, got {stdout:?}"
    );
    assert!(
        uuid::Uuid::parse_str(identifier).is_ok(),
        "quiet stdout must be a full UUID, got {identifier:?}"
    );
    assert!(
        output.stderr.is_empty(),
        "quiet task add must not write to stderr: {}",
        String::from_utf8_lossy(&output.stderr)
    );
}

#[test]
fn test_given_project_when_project_ls_quiet_then_stdout_is_rows_without_header_or_status_prefix() {
    // Given
    let temp_env = TempEnvDir::new("oxy_quiet_project_ls");
    let project =
        execute_oxy_with_timeout(&temp_env, &["project", "add", "Quiet Listing"], OXY_TIMEOUT);
    assert!(project.status.success(), "project setup failed");

    // When
    let output = execute_oxy_with_timeout(&temp_env, &["project", "ls", "-q"], OXY_TIMEOUT);

    // Then
    assert!(
        output.status.success(),
        "quiet project ls failed: stderr={}",
        String::from_utf8_lossy(&output.stderr)
    );
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert_eq!(stdout.lines().count(), 1, "unexpected stdout: {stdout:?}");
    assert!(stdout.contains("Quiet Listing"));
    assert!(!stdout.contains("Projects:"));
    assert!(!stdout.contains('✅'));
}

#[test]
fn test_given_fresh_database_when_project_ls_quiet_then_stdout_is_empty_and_exit_is_zero() {
    // Given
    let temp_env = TempEnvDir::new("oxy_quiet_project_ls_empty");

    // When
    let output = execute_oxy_with_timeout(&temp_env, &["project", "ls", "-q"], OXY_TIMEOUT);

    // Then
    assert!(
        output.status.success(),
        "quiet empty listing must succeed: stderr={}",
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(
        String::from_utf8_lossy(&output.stdout).trim().is_empty(),
        "quiet empty listing must not print a notice"
    );
}

#[test]
fn test_given_no_projects_when_task_add_quiet_then_fails_on_stderr_with_nonzero_exit() {
    // Given
    let temp_env = TempEnvDir::new("oxy_quiet_task_add_error");

    // When
    let output = execute_oxy_with_timeout(&temp_env, &["task", "add", "Orphan", "-q"], OXY_TIMEOUT);

    // Then
    assert!(
        !output.status.success(),
        "quiet mode must not hide the failure"
    );
    assert!(
        !output.stderr.is_empty(),
        "the failure reason must still be reported on stderr"
    );
}
