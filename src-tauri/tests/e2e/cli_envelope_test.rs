use crate::e2e::support::{execute_oxy_with_timeout, TempEnvDir};
use serde_json::Value;
use std::time::Duration;

const OXY_TIMEOUT: Duration = Duration::from_secs(20);

fn stdout_of(env: &TempEnvDir, args: &[&str]) -> String {
    let output = execute_oxy_with_timeout(env, args, OXY_TIMEOUT);
    assert!(
        output.status.success(),
        "{args:?} failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    String::from_utf8_lossy(&output.stdout).into_owned()
}

fn seed_task(env: &TempEnvDir) -> String {
    stdout_of(env, &["project", "add", "Envelope Project"]);
    stdout_of(
        env,
        &[
            "task",
            "add",
            "Envelope Task",
            "-p",
            "Envelope Project",
            "-q",
        ],
    )
    .trim()
    .to_string()
}

fn assert_single_line_envelope(stdout: &str, schema: &str) -> Value {
    let body = stdout
        .strip_suffix('\n')
        .expect("envelope must end with one newline");
    assert!(
        !body.contains('\n'),
        "envelope must be one line: {stdout:?}"
    );
    let envelope: Value = serde_json::from_str(body).expect("stdout must be valid JSON");
    assert_eq!(envelope["schema"], schema);
    envelope
}

#[test]
fn test_given_fresh_database_when_status_machine_then_stdout_is_one_compact_envelope_line() {
    // Given
    let env = TempEnvDir::new("oxy_envelope_machine");

    // When
    let stdout = stdout_of(&env, &["--machine", "status"]);

    // Then
    let envelope = assert_single_line_envelope(&stdout, "oxy.status");
    assert_eq!(envelope["schemaVersion"], 1);
    assert_eq!(envelope["data"]["running"], false);
}

#[test]
fn test_given_piped_stdout_when_status_json_then_output_is_compact_not_pretty() {
    // Given
    let env = TempEnvDir::new("oxy_envelope_json_piped");

    // When
    let stdout = stdout_of(&env, &["--json", "status"]);

    // Then
    assert_single_line_envelope(&stdout, "oxy.status");
}

#[test]
fn test_given_task_when_start_then_stop_machine_then_both_emit_envelopes_with_matching_ids() {
    // Given
    let env = TempEnvDir::new("oxy_envelope_start_stop");
    let task_id = seed_task(&env);

    // When
    let started = stdout_of(&env, &["--machine", "start", &task_id]);
    let stopped = stdout_of(&env, &["--machine", "stop"]);

    // Then
    let start = assert_single_line_envelope(&started, "oxy.start");
    assert_eq!(start["data"]["taskId"], task_id.as_str());
    assert!(start["data"]["timeLogId"].is_string());
    let stop = assert_single_line_envelope(&stopped, "oxy.stop");
    assert_eq!(stop["data"]["stoppedCount"], 1);
}

#[test]
fn test_given_task_when_start_quiet_then_stdout_is_exactly_the_time_log_id() {
    // Given
    let env = TempEnvDir::new("oxy_envelope_quiet_start");
    let task_id = seed_task(&env);

    // When
    let stdout = stdout_of(&env, &["start", &task_id, "-q"]);

    // Then
    let identifier = stdout.strip_suffix('\n').expect("one trailing newline");
    assert!(identifier.starts_with("log_"), "got {identifier:?}");
    assert!(!identifier.contains(char::is_whitespace));
}
