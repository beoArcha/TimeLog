use crate::e2e::support::{execute_oxy_with_timeout, TempEnvDir};
use crate::shared::xsd_validator::assert_valid_report_xml;
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
    assert!(csv.starts_with("entryId,projectId,projectName,"), "{csv}");
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
fn test_given_the_binary_when_xml_is_asked_for_each_variant_then_stdout_validates_against_the_v2_xsd(
) {
    // Given
    let env = seeded_env("oxy_report_xml_variants");

    for (variant, has_entries) in [("full", true), ("summary", false)] {
        // When
        let output = run(
            &env,
            &["report", "-f", "xml", "--variant", variant, "-o", "-"],
        );

        // Then
        assert!(output.status.success(), "{variant}: {}", stderr_of(&output));
        assert!(
            output.stderr.is_empty(),
            "{variant}: {}",
            stderr_of(&output)
        );
        let xml = String::from_utf8(output.stdout).expect("XML is UTF-8");
        assert_valid_report_xml(&xml);
        assert!(xml.contains("Export Task"), "{variant}");
        assert_eq!(xml.contains("<entries"), has_entries, "{variant}");
        assert_eq!(xml.contains("<days"), has_entries, "{variant}");
    }
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

#[test]
fn test_given_the_binary_when_summary_csv_goes_to_stdout_then_it_lists_one_row_per_task() {
    // Given
    let env = seeded_env("oxy_report_csv_summary");

    // When
    let output = run(
        &env,
        &[
            "report",
            "--format",
            "csv",
            "--variant",
            "summary",
            "-o",
            "-",
        ],
    );

    // Then
    assert!(output.status.success(), "{}", stderr_of(&output));
    assert!(output.stderr.is_empty(), "{}", stderr_of(&output));
    let csv = String::from_utf8(output.stdout).expect("csv is UTF-8");
    let lines: Vec<&str> = csv.lines().collect();
    assert_eq!(lines.len(), 2, "{csv}");
    assert!(lines[0].starts_with("projectId,projectName,taskId,taskName,parentTaskId,"));
    assert!(lines[1].contains(",Export Project,"));
    assert!(lines[1].contains(",Export Task,,2700,2700,0.75,10000,"));
}

#[test]
fn test_given_the_binary_when_csv_runs_with_bom_and_semicolon_then_stdout_starts_with_the_bom() {
    // Given
    let env = seeded_env("oxy_report_csv_bom");

    // When
    let output = run(
        &env,
        &[
            "report",
            "-f",
            "csv",
            "--csv-delimiter",
            ";",
            "--bom",
            "-o",
            "-",
        ],
    );

    // Then
    assert!(output.status.success(), "{}", stderr_of(&output));
    assert_eq!(&output.stdout[..3], &[0xEF, 0xBB, 0xBF]);
    let csv = String::from_utf8(output.stdout[3..].to_vec()).expect("csv is UTF-8");
    assert!(csv.starts_with("entryId;projectId;projectName;"), "{csv}");
}

#[test]
fn test_given_the_binary_when_csv_options_are_invalid_then_exits_2_without_writing_stdout() {
    // Given
    let env = seeded_env("oxy_report_csv_option_errors");
    let rejected: [&[&str]; 3] = [
        &["report", "-f", "csv", "--csv-delimiter", "|", "-o", "-"],
        &["report", "--format", "json", "--bom", "-o", "-"],
        &["report", "-f", "xlsx", "--csv-delimiter", ";", "-o", "-"],
    ];

    for args in rejected {
        // When
        let output = run(&env, args);

        // Then
        assert_eq!(output.status.code(), Some(2), "{args:?}");
        assert!(output.stdout.is_empty(), "{args:?}");
        assert!(stderr_of(&output).contains("--"), "{args:?}");
    }
}
