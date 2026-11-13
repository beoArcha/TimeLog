use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::{setup_persistence_test, TempCsvDir};
use clap::Parser;
use oxyflow_timelog::cli::{handle_cli, CliArgs, CliError, CliOutput};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::{NewTimeLog, ReportExportPayload, ReportVariant};
use rusqlite::Connection;
use std::fs;

fn setup_dataset(db_name: &str) -> (Persistence, Connection, TempCsvDir) {
    let (conn, config, temp_dir) = setup_persistence_test(db_name);
    let persistence = Persistence::new(&config).expect("failed to create persistence layer");

    let project = ProjectBuilder::new()
        .with_id("p_delivery_01")
        .with_name("Delivery Project")
        .build();
    let task = TaskBuilder::new()
        .with_id("t_delivery_01")
        .with_project_id("p_delivery_01")
        .with_name("Delivery Task")
        .build();
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();
    persistence
        .time_logs
        .insert_full(&NewTimeLog {
            id: "log_delivery_01".to_string(),
            task_id: "t_delivery_01".to_string(),
            start_time: "2026-10-15T08:00:00Z".to_string(),
            end_time: Some("2026-10-15T10:00:00Z".to_string()),
            note: Some("delivery note".to_string()),
        })
        .unwrap();

    (persistence, conn, temp_dir)
}

fn run(persistence: &Persistence, argv: &[&str]) -> Result<CliOutput, CliError> {
    let args = CliArgs::try_parse_from(argv).expect("arguments must parse");
    handle_cli(args, persistence, &Engine::new(persistence))
}

fn stdout_bytes(output: CliOutput) -> Vec<u8> {
    match output {
        CliOutput::Bytes(bytes) => bytes,
        other => panic!("Expected CliOutput::Bytes, got {other:?}"),
    }
}

#[test]
fn test_given_logged_work_when_report_csv_goes_to_stdout_then_returns_the_exact_file_bytes() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_csv_stdout");
    let dir = tempfile::tempdir().expect("create temp dir");
    let file = dir.path().join("report.csv");

    // When
    let streamed = run(&persistence, &["oxy", "report", "-f", "csv", "-o", "-"]).unwrap();
    run(
        &persistence,
        &["oxy", "report", "-f", "csv", "-o", file.to_str().unwrap()],
    )
    .unwrap();

    // Then
    assert_eq!(stdout_bytes(streamed), fs::read(&file).unwrap());
}

#[test]
fn test_given_two_exports_of_the_same_data_when_run_back_to_back_then_csv_bytes_are_identical() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_deterministic_csv");

    // When
    let first = run(&persistence, &["oxy", "report", "-f", "csv", "-o", "-"]).unwrap();
    let second = run(&persistence, &["oxy", "report", "-f", "csv", "-o", "-"]).unwrap();

    // Then
    assert_eq!(stdout_bytes(first), stdout_bytes(second));
}

#[test]
fn test_given_logged_work_when_json_is_requested_without_output_then_stdout_gets_the_bare_document()
{
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_json_stdout");

    // When
    let output = run(&persistence, &["oxy", "report", "-f", "json"]).unwrap();

    // Then
    let text = String::from_utf8(stdout_bytes(output)).unwrap();
    assert!(text.ends_with("}\n"));
    let value: serde_json::Value = serde_json::from_str(&text).unwrap();
    assert_eq!(value["schema"], "oxy.report");
    assert_eq!(value["schemaVersion"], 2);
    assert!(value.get("data").is_none(), "the export is not enveloped");
}

#[test]
fn test_given_summary_variant_when_report_runs_in_machine_mode_then_envelope_document_has_no_entries(
) {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_summary_envelope");

    // When
    let output = run(
        &persistence,
        &["oxy", "--json", "report", "--variant", "summary"],
    )
    .unwrap();

    // Then
    let CliOutput::Envelope(envelope) = output else {
        panic!("expected envelope output");
    };
    assert_eq!(envelope.schema, "oxy.report");
    assert_eq!(envelope.schema_version, 2);
    assert_eq!(envelope.data["variant"], "summary");
    assert!(envelope.data.get("entries").is_none());
}

#[test]
fn test_given_machine_mode_and_output_path_when_exporting_then_prints_the_export_envelope() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_export_envelope");
    let dir = tempfile::tempdir().expect("create temp dir");
    let file = dir.path().join("report.csv");
    let path = file.to_str().unwrap();

    // When
    let output = run(
        &persistence,
        &["oxy", "-m", "report", "-f", "csv", "-o", path],
    )
    .unwrap();

    // Then
    let CliOutput::Envelope(envelope) = output else {
        panic!("expected envelope output");
    };
    assert_eq!(envelope.schema, "oxy.report.export");
    assert_eq!(envelope.schema_version, 1);
    let payload: ReportExportPayload = serde_json::from_value(envelope.data).unwrap();
    assert_eq!(payload.path, path);
    assert_eq!(payload.format, "csv");
    assert_eq!(payload.variant, ReportVariant::Full);
    assert_eq!(payload.total_seconds, 7200);
    assert!(file.exists());
}

#[test]
fn test_given_quiet_table_report_when_run_then_prints_only_the_totals_line() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_quiet_table");

    // When
    let output = run(&persistence, &["oxy", "-q", "report"]).unwrap();

    // Then
    assert_eq!(
        output,
        CliOutput::Raw("Total Time: 02h 00m (1 active tasks)".to_string())
    );
}

#[test]
fn test_given_quiet_report_without_data_when_run_then_still_prints_a_zero_totals_line() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_delivery_quiet_empty");
    let persistence = Persistence::new(&config).expect("failed to create persistence layer");

    // When
    let output = run(&persistence, &["oxy", "-q", "report"]).unwrap();

    // Then
    assert_eq!(
        output,
        CliOutput::Raw("Total Time: 00m 00s (0 active tasks)".to_string())
    );
}

#[test]
fn test_given_quiet_export_to_a_file_when_run_then_prints_only_the_path() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_quiet_export");
    let dir = tempfile::tempdir().expect("create temp dir");
    let file = dir.path().join("report.html");
    let path = file.to_str().unwrap();

    // When
    let output = run(
        &persistence,
        &["oxy", "-q", "report", "-f", "html", "-o", path],
    )
    .unwrap();

    // Then
    assert_eq!(output, CliOutput::Raw(path.to_string()));
    assert!(file.exists());
}

#[test]
fn test_given_quiet_flag_when_exporting_to_stdout_then_output_is_unaffected() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_quiet_stdout");

    // When
    let loud = run(&persistence, &["oxy", "report", "-f", "csv", "-o", "-"]).unwrap();
    let quiet = run(
        &persistence,
        &["oxy", "-q", "report", "-f", "csv", "-o", "-"],
    )
    .unwrap();

    // Then
    assert_eq!(stdout_bytes(loud), stdout_bytes(quiet));
}

#[test]
fn test_given_xml_format_when_summary_variant_is_requested_then_fails_with_a_syntax_error() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_xml_summary");

    // When
    let result = run(
        &persistence,
        &[
            "oxy",
            "report",
            "-f",
            "xml",
            "--variant",
            "summary",
            "-o",
            "-",
        ],
    );

    // Then
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 2);
    let message = err.to_string();
    assert!(
        message.contains("'xml'") && message.contains("'summary'"),
        "{message}"
    );
}

#[test]
fn test_given_binary_format_when_no_output_is_given_then_fails_with_a_syntax_error() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_binary_no_output");

    for format in ["xlsx", "ods"] {
        // When
        let result = run(&persistence, &["oxy", "report", "-f", format]);

        // Then
        let err = result.unwrap_err();
        assert_eq!(err.exit_code(), 2, "{format}");
        assert!(err.to_string().contains(format), "{format}");
    }
}

#[test]
fn test_given_binary_format_when_output_is_dash_then_streams_the_workbook_bytes() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_binary_dash");

    // When
    let output = run(&persistence, &["oxy", "report", "-f", "xlsx", "-o", "-"]).unwrap();

    // Then
    let bytes = stdout_bytes(output);
    assert!(
        bytes.starts_with(b"PK"),
        "an xlsx workbook is a ZIP archive"
    );
}

#[test]
fn test_given_table_format_when_output_is_a_file_then_writes_the_tree_without_a_status_prefix() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_table_file");
    let dir = tempfile::tempdir().expect("create temp dir");
    let file = dir.path().join("report.txt");

    // When
    run(
        &persistence,
        &["oxy", "report", "-o", file.to_str().unwrap()],
    )
    .unwrap();

    // Then
    let content = fs::read_to_string(&file).unwrap();
    assert!(content.starts_with("📊 Time Tracking Hierarchy Report"));
    assert!(content.contains("Delivery Task"));
}
