use crate::e2e::support::{execute_oxy_with_timeout, TempEnvDir};
use serde_json::Value;
use std::process::Output;
use std::time::Duration;

const OXY_TIMEOUT: Duration = Duration::from_secs(30);

fn run(env: &TempEnvDir, args: &[&str]) -> Output {
    execute_oxy_with_timeout(env, args, OXY_TIMEOUT)
}

fn quiet_id(env: &TempEnvDir, args: &[&str]) -> String {
    let output = run(env, args);
    assert!(
        output.status.success(),
        "seeding {args:?} failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    String::from_utf8_lossy(&output.stdout).trim().to_string()
}

fn seeded_env(prefix: &str) -> TempEnvDir {
    let env = TempEnvDir::new(prefix);
    let project = quiet_id(&env, &["project", "add", "Export Project", "-q"]);
    let task = quiet_id(&env, &["task", "add", "Export Task", "-p", &project, "-q"]);
    quiet_id(&env, &["log", "add", &task, "45m", "-q"]);
    env
}

fn stderr_of(output: &Output) -> String {
    String::from_utf8_lossy(&output.stderr).into_owned()
}

#[test]
fn test_given_the_binary_when_report_csv_goes_to_stdout_then_stdout_is_exactly_the_csv_and_stderr_is_empty(
) {
    // Given
    let env = seeded_env("oxy_report_csv_stdout");

    // When
    let output = run(&env, &["report", "--format", "csv", "-o", "-"]);

    // Then
    assert!(output.status.success(), "{}", stderr_of(&output));
    assert!(output.stderr.is_empty(), "{}", stderr_of(&output));
    let csv = String::from_utf8(output.stdout).expect("csv is UTF-8");
    assert!(csv.starts_with("Project,Task,Subtask,"), "{csv}");
    assert!(csv.contains("Export Task"));
    assert!(csv.ends_with('\n') && !csv.ends_with("\n\n"), "{csv:?}");
}

#[test]
fn test_given_the_binary_when_report_json_goes_to_stdout_then_it_is_the_bare_document() {
    // Given
    let env = seeded_env("oxy_report_json_stdout");

    // When
    let output = run(&env, &["report", "-f", "json", "-o", "-"]);

    // Then
    assert!(output.status.success(), "{}", stderr_of(&output));
    let document: Value = serde_json::from_slice(&output.stdout).expect("one JSON document");
    assert_eq!(document["schema"], "oxy.report");
    assert_eq!(document["schemaVersion"], 2);
    assert_eq!(document["totals"]["seconds"], 2700);
}

#[test]
fn test_given_the_binary_when_xml_is_asked_for_the_summary_variant_then_exits_2_naming_format_and_variant(
) {
    // Given
    let env = seeded_env("oxy_report_variant_rejected");

    // When
    let output = run(
        &env,
        &["report", "-f", "xml", "--variant", "summary", "-o", "-"],
    );

    // Then
    assert_eq!(output.status.code(), Some(2));
    assert!(output.stdout.is_empty(), "no partial export on stdout");
    let stderr = stderr_of(&output);
    assert!(
        stderr.contains("'xml'") && stderr.contains("'summary'"),
        "{stderr}"
    );
}

#[test]
fn test_given_the_binary_when_a_binary_format_has_no_output_then_exits_2_without_writing_stdout() {
    // Given
    let env = seeded_env("oxy_report_binary_no_output");

    for format in ["xlsx", "ods"] {
        // When
        let output = run(&env, &["report", "--format", format]);

        // Then
        assert_eq!(output.status.code(), Some(2), "{format}");
        assert!(output.stdout.is_empty(), "{format}");
        assert!(stderr_of(&output).contains(format), "{format}");
    }
}

#[test]
fn test_given_the_binary_when_a_binary_format_goes_to_dash_then_stdout_is_the_raw_archive() {
    // Given
    let env = seeded_env("oxy_report_binary_dash");

    // When
    let output = run(&env, &["report", "--format", "xlsx", "-o", "-"]);

    // Then
    assert!(output.status.success(), "{}", stderr_of(&output));
    assert!(output.stdout.starts_with(b"PK"), "xlsx is a ZIP archive");
}

#[test]
fn test_given_the_binary_when_quiet_report_runs_then_stdout_is_one_totals_line() {
    // Given
    let env = seeded_env("oxy_report_quiet");

    // When
    let output = run(&env, &["report", "-q"]);

    // Then
    assert!(output.status.success(), "{}", stderr_of(&output));
    assert_eq!(
        String::from_utf8_lossy(&output.stdout),
        "Total Time: 45m 00s (1 active tasks)\n"
    );
}

#[test]
fn test_given_the_binary_when_quiet_export_to_a_file_runs_then_stdout_is_only_the_path() {
    // Given
    let env = seeded_env("oxy_report_quiet_export");
    let target = env.path.join("quiet.csv");
    let target_str = target.to_str().unwrap();

    // When
    let output = run(&env, &["report", "-q", "-f", "csv", "-o", target_str]);

    // Then
    assert!(output.status.success(), "{}", stderr_of(&output));
    assert_eq!(
        String::from_utf8_lossy(&output.stdout),
        format!("{target_str}\n")
    );
    assert!(target.exists());
}

#[test]
fn test_given_the_binary_when_the_removed_report_forms_are_used_then_exits_2() {
    // Given
    let env = TempEnvDir::new("oxy_report_removed_forms");
    let removed: [&[&str]; 3] = [
        &["report", "export", "-f", "csv", "-o", "x.csv"],
        &["report", "tree"],
        &["report", "--tree"],
    ];

    for args in removed {
        // When
        let output = run(&env, args);

        // Then
        assert_eq!(output.status.code(), Some(2), "{args:?}");
        assert!(output.stdout.is_empty(), "{args:?}");
    }
}
