use crate::e2e::support::{execute_oxy_with_timeout, TempEnvDir};
use serde_json::Value;
use std::time::Duration;

const OXY_TIMEOUT: Duration = Duration::from_secs(30);

struct SeededIds {
    project_a: String,
    project_b: String,
    task_a: String,
    task_b: String,
    log: String,
}

fn quiet_id(env: &TempEnvDir, args: &[&str]) -> String {
    let output = execute_oxy_with_timeout(env, args, OXY_TIMEOUT);
    assert!(
        output.status.success(),
        "seeding {args:?} failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    String::from_utf8_lossy(&output.stdout).trim().to_string()
}

fn seed(env: &TempEnvDir) -> SeededIds {
    let project_a = quiet_id(env, &["project", "add", "Contract Project A", "-q"]);
    let project_b = quiet_id(env, &["project", "add", "Contract Project B", "-q"]);
    let task_a = quiet_id(
        env,
        &["task", "add", "Contract Task A", "-p", &project_a, "-q"],
    );
    let task_b = quiet_id(
        env,
        &["task", "add", "Contract Task B", "-p", &project_a, "-q"],
    );
    let log = quiet_id(env, &["log", "add", &task_a, "30m", "-q"]);
    SeededIds {
        project_a,
        project_b,
        task_a,
        task_b,
        log,
    }
}

fn args(parts: &[&str]) -> Vec<String> {
    parts.iter().map(|part| part.to_string()).collect()
}

/// Every implemented machine-readable command. The order matters: later commands read what
/// earlier ones wrote.
fn contract_commands(
    ids: &SeededIds,
    csv_dir: &str,
    backup_path: &str,
    report_path: &str,
) -> Vec<Vec<String>> {
    let (task_a, task_b) = (ids.task_a.as_str(), ids.task_b.as_str());
    vec![
        args(&["--json", "status"]),
        args(&["--json", "start", task_a]),
        args(&["--json", "start", task_a]),
        args(&["--json", "start"]),
        args(&["--json", "status"]),
        args(&["--json", "switch", task_b]),
        args(&["--json"]),
        args(&["--json", "today"]),
        args(&["--json", "report"]),
        args(&["--json", "report", "--variant", "summary"]),
        args(&["--json", "report", "-o", report_path]),
        args(&["--json", "stop"]),
        args(&["--json", "stop", "--if-running"]),
        args(&["--json", "project", "ls"]),
        args(&["--json", "project", "add", "Contract Created Project"]),
        args(&[
            "--json",
            "project",
            "rename",
            &ids.project_b,
            "Contract Renamed Project",
        ]),
        args(&["--json", "project", "archive", &ids.project_b]),
        args(&["--json", "task", "ls"]),
        args(&[
            "--json",
            "task",
            "add",
            "Contract Created Task",
            "-p",
            &ids.project_a,
        ]),
        args(&["--json", "task", "rename", task_b, "Contract Renamed Task"]),
        args(&["--json", "task", "rate", task_b, "90"]),
        args(&["--json", "task", "reparent", task_b, task_a]),
        args(&["--json", "task", "reparent", task_b, "root"]),
        args(&["--json", "task", "done", task_b]),
        args(&["--json", "task", "move", task_a, &ids.project_a]),
        args(&["--json", "task", "archive", task_b]),
        args(&["--json", "log", "ls"]),
        args(&[
            "--json",
            "log",
            "edit",
            &ids.log,
            "--reason",
            "contract verification",
            "--note",
            "edited note",
        ]),
        args(&["--json", "log", "rm", &ids.log]),
        // Added after the edit: logs may not overlap, so the new one must not exist while the seeded one is edited.
        args(&["--json", "log", "add", task_a, "45m"]),
        args(&["--json", "config", "set", "ui_theme", "dark"]),
        args(&["--json", "config", "get", "ui_theme"]),
        args(&["--json", "config", "get", "cli_machine_locale"]),
        args(&["--json", "config", "ls"]),
        args(&["--json", "sink", "set-csv", "--dir", csv_dir]),
        args(&[
            "--json",
            "sink",
            "set-webhook",
            "--url",
            "https://example.com/hook",
            "--token",
            "contract-token",
        ]),
        args(&["--json", "sink", "ls"]),
        args(&["--json", "sink", "test"]),
        args(&["--json", "mask", "set", "review", "log add PR 30m"]),
        args(&["--json", "mask", "ls"]),
        args(&["--json", "mask", "rm", "review"]),
        args(&["--json", "doctor"]),
        args(&["--json", "db", "backup", backup_path]),
        args(&["--json", "db", "restore", backup_path]),
    ]
}

fn assert_contract_envelope(command: &[String], stdout: &str) {
    let body = stdout
        .strip_suffix('\n')
        .unwrap_or_else(|| panic!("{command:?} stdout must end with one newline: {stdout:?}"));
    assert!(
        !body.contains('\n'),
        "{command:?} stdout must be a single line: {stdout:?}"
    );
    let envelope: Value = serde_json::from_str(body)
        .unwrap_or_else(|e| panic!("{command:?} stdout is not JSON ({e}): {stdout:?}"));
    assert!(envelope.is_object(), "{command:?} stdout must be an object");

    let schema = envelope["schema"].as_str().unwrap_or_default();
    assert!(
        schema.starts_with("oxy."),
        "{command:?} schema {schema:?} must start with oxy."
    );
    assert!(
        envelope["schemaVersion"].as_u64().is_some_and(|v| v >= 1),
        "{command:?} schemaVersion must be an integer >= 1: {envelope}"
    );
    assert!(
        envelope["meta"]["generatedAt"].is_string(),
        "{command:?} meta.generatedAt missing"
    );
    assert!(
        envelope["meta"]["generator"].is_object(),
        "{command:?} meta.generator missing"
    );
    assert!(
        envelope.get("data").is_some(),
        "{command:?} data missing: {envelope}"
    );
}

#[test]
fn test_given_seeded_database_when_each_json_command_runs_then_stdout_is_one_envelope_and_stderr_is_empty(
) {
    // Given
    let env = TempEnvDir::new("oxy_json_contract");
    let ids = seed(&env);
    let csv_dir = env.path.join("contract_csv");
    let backup_path = env.path.join("contract_backup.db");
    let report_path = env.path.join("contract_report.csv");
    let commands = contract_commands(
        &ids,
        csv_dir.to_str().unwrap(),
        backup_path.to_str().unwrap(),
        report_path.to_str().unwrap(),
    );

    for command in commands {
        let command_args: Vec<&str> = command.iter().map(String::as_str).collect();

        // When
        let output = execute_oxy_with_timeout(&env, &command_args, OXY_TIMEOUT);

        // Then
        let stderr = String::from_utf8_lossy(&output.stderr);
        assert!(output.status.success(), "{command:?} failed: {stderr}");
        assert!(stderr.is_empty(), "{command:?} wrote to stderr: {stderr}");
        assert_contract_envelope(&command, &String::from_utf8_lossy(&output.stdout));
    }
}
