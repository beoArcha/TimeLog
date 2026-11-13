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
fn test_given_fresh_database_when_doctor_machine_then_stdout_is_one_compact_doctor_envelope() {
    // Given
    let env = TempEnvDir::new("oxy_envelope_doctor");

    // When
    let stdout = stdout_of(&env, &["--machine", "doctor"]);

    // Then
    let envelope = assert_single_line_envelope(&stdout, "oxy.doctor");
    assert_eq!(envelope["schemaVersion"], 1);
    assert_eq!(envelope["data"]["overallStatus"], "ok");
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

#[test]
fn test_given_ambiguous_task_target_in_json_mode_when_marking_done_then_stderr_has_structured_candidates_envelope_and_stdout_is_empty(
) {
    // Given
    let env = TempEnvDir::new("oxy_ambiguous_task_json");
    stdout_of(&env, &["project", "add", "Ambiguous Project"]);
    stdout_of(
        &env,
        &[
            "task",
            "add",
            "Duplicate Task",
            "-p",
            "Ambiguous Project",
            "-q",
        ],
    );
    stdout_of(
        &env,
        &[
            "task",
            "add",
            "Duplicate Task",
            "-p",
            "Ambiguous Project",
            "-q",
        ],
    );

    // When - oxy task done "Duplicate Task" --json
    let output = execute_oxy_with_timeout(
        &env,
        &["task", "done", "Duplicate Task", "--json"],
        OXY_TIMEOUT,
    );

    // Then
    assert_eq!(output.status.code(), Some(4));
    assert!(
        output.stdout.is_empty(),
        "stdout must stay completely empty in machine mode error, got: {}",
        String::from_utf8_lossy(&output.stdout)
    );

    let stderr_str = String::from_utf8_lossy(&output.stderr);
    let envelope: Value = serde_json::from_str(&stderr_str)
        .unwrap_or_else(|e| panic!("stderr failed to parse as JSON: {e}\nstderr: {stderr_str}"));

    assert_eq!(envelope["code"], "DOM_ENTITY_AMBIGUOUS");
    assert_eq!(envelope["exit_code"], 4);
    assert_eq!(envelope["category"], "entity");

    let candidates = envelope["details"]["candidates"]
        .as_array()
        .expect("details.candidates must be an array");
    assert_eq!(candidates.len(), 2, "must return exactly 2 candidate matches");

    for candidate in candidates {
        assert!(candidate["id"].is_string());
        assert_eq!(candidate["name"], "Duplicate Task");
    }

    assert!(envelope["details"].get("suggestion").is_none());
    assert!(envelope["details"].get("field").is_none());
    assert!(envelope["details"].get("value").is_none());
}

