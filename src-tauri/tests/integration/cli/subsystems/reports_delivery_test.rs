use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::{setup_persistence_test, TempCsvDir};
use crate::shared::xsd_validator::assert_valid_report_xml;
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
fn test_given_xml_format_when_summary_variant_is_requested_then_stdout_is_a_valid_document_without_entries(
) {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_xml_summary");

    // When
    let output = run(
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
    )
    .unwrap();

    // Then
    let xml = String::from_utf8(stdout_bytes(output)).expect("XML is UTF-8");
    assert_valid_report_xml(&xml);
    assert!(xml.contains("variant=\"summary\""));
    assert!(!xml.contains("<entries"));
    assert!(!xml.contains("<days"));
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

fn csv_stdout(persistence: &Persistence, extra: &[&str]) -> Vec<u8> {
    let mut argv = vec!["oxy", "report", "-f", "csv", "-o", "-"];
    argv.extend_from_slice(extra);
    stdout_bytes(run(persistence, &argv).unwrap())
}

fn syntax_exit_code(result: Result<CliOutput, CliError>) -> u8 {
    result.expect_err("the flags must be rejected").exit_code()
}

#[test]
fn test_given_logged_work_when_full_csv_goes_to_stdout_then_it_has_one_row_per_entry() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_csv_full_rows");

    // When
    let bytes = csv_stdout(&persistence, &[]);

    // Then
    let csv = String::from_utf8(bytes).unwrap();
    let lines: Vec<&str> = csv.lines().collect();
    assert_eq!(lines.len(), 2);
    assert!(lines[0].starts_with("entryId,projectId,projectName,taskId,taskName,date,"));
    assert!(lines[1].starts_with(
        "log_delivery_01,p_delivery_01,Delivery Project,t_delivery_01,Delivery Task,"
    ));
    assert!(lines[1].contains(",2026-10-15T08:00:00Z,2026-10-15T10:00:00Z,7200,delivery note,"));
}

#[test]
fn test_given_logged_work_when_summary_csv_goes_to_stdout_then_it_has_one_row_per_task() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_csv_summary_rows");

    // When
    let bytes = csv_stdout(&persistence, &["--variant", "summary"]);

    // Then
    let csv = String::from_utf8(bytes).unwrap();
    let lines: Vec<&str> = csv.lines().collect();
    assert_eq!(lines.len(), 2);
    assert!(lines[0].starts_with("projectId,projectName,taskId,taskName,parentTaskId,seconds,"));
    assert!(lines[1].starts_with(
        "p_delivery_01,Delivery Project,t_delivery_01,Delivery Task,,7200,7200,2.00,10000,"
    ));
}

#[test]
fn test_given_semicolon_delimiter_and_bom_when_csv_goes_to_stdout_then_output_starts_with_bom_and_uses_semicolons(
) {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_csv_bom_semicolon");

    // When
    let bytes = csv_stdout(&persistence, &["--csv-delimiter", ";", "--bom"]);

    // Then
    assert_eq!(&bytes[..3], &[0xEF, 0xBB, 0xBF]);
    let csv = String::from_utf8(bytes[3..].to_vec()).unwrap();
    assert!(csv.starts_with("entryId;projectId;projectName;"));
}

#[test]
fn test_given_csv_options_when_exporting_to_stdout_and_to_a_file_then_bytes_are_identical() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_csv_options_parity");
    let dir = tempfile::tempdir().expect("create temp dir");
    let file = dir.path().join("report.csv");
    let options = ["--csv-delimiter", "tab", "--bom"];

    // When
    let streamed = csv_stdout(&persistence, &options);
    let mut argv = vec!["oxy", "report", "-f", "csv", "-o", file.to_str().unwrap()];
    argv.extend_from_slice(&options);
    run(&persistence, &argv).unwrap();

    // Then
    assert_eq!(streamed, fs::read(&file).unwrap());
}

#[test]
fn test_given_bom_with_a_non_csv_format_when_planning_then_exits_2_before_writing() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_bom_with_json");

    // When
    let with_json = run(
        &persistence,
        &["oxy", "report", "--format", "json", "--bom", "-o", "-"],
    );
    let with_default_table = run(&persistence, &["oxy", "report", "--bom"]);

    // Then
    assert_eq!(syntax_exit_code(with_json), 2);
    assert_eq!(syntax_exit_code(with_default_table), 2);
}

#[test]
fn test_given_an_unsupported_csv_delimiter_when_planning_then_exits_2() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_delivery_bad_delimiter");

    // When
    let pipe = run(
        &persistence,
        &[
            "oxy",
            "report",
            "-f",
            "csv",
            "--csv-delimiter",
            "|",
            "-o",
            "-",
        ],
    );
    let with_json = run(
        &persistence,
        &[
            "oxy",
            "report",
            "-f",
            "json",
            "--csv-delimiter",
            ";",
            "-o",
            "-",
        ],
    );

    // Then
    assert_eq!(syntax_exit_code(pipe), 2);
    assert_eq!(syntax_exit_code(with_json), 2);
}
