use crate::shared::report_document_builders::{
    a_document, a_project, a_project_patch_entry, a_subtask, a_task, an_entry,
};
use oxyflow_timelog::cli::error::{CliError, CliSyntaxError};
use oxyflow_timelog::cli::exporters::{
    export_to_bytes_with_options, sanitize_csv_formula, write_csv, CsvDelimiter, CsvOptions,
    ExportOptions,
};
use oxyflow_timelog::cli::parser::ExportFormat;
use oxyflow_timelog::types::{ReportDocument, ReportRateStatus, ReportVariant};

const SUMMARY_GOLDEN: &str = include_str!("../../shared/fixtures/report-csv-summary.golden.csv");
const FULL_GOLDEN: &str = include_str!("../../shared/fixtures/report-csv-full.golden.csv");

fn render(document: &ReportDocument, options: CsvOptions) -> Vec<u8> {
    let mut buffer = Vec::new();
    write_csv(document, options, &mut buffer).expect("csv must render");
    buffer
}

fn render_text(document: &ReportDocument, options: CsvOptions) -> String {
    String::from_utf8(render(document, options)).expect("csv is UTF-8")
}

/// The golden files may be checked out with CRLF line endings on Windows.
fn golden(text: &str) -> String {
    text.replace("\r\n", "\n")
}

fn summary_golden_document() -> ReportDocument {
    let mut document = a_document(ReportVariant::Summary);

    let mut alpha = a_project();
    alpha.id = "p-alpha".to_string();
    alpha.name = "Zażółć gęślą jaźń".to_string();
    alpha.direct_seconds = 600;

    let mut backend = a_task();
    backend.id = "t-backend".to_string();
    backend.name = "Backend, API \"v2\"".to_string();
    backend.seconds = 5400;
    backend.direct_seconds = 3600;
    backend.share_basis_points = 6000;
    backend.rate_minor = Some(15_000);
    backend.currency = Some("PLN".to_string());
    backend.rate_status = ReportRateStatus::Custom;
    backend.amount_minor = Some(15_000);

    let mut review = a_subtask();
    review.id = "t-review".to_string();
    review.name = "Przegląd kodu".to_string();
    review.parent_task_id = "t-backend".to_string();
    review.seconds = 1800;
    review.direct_seconds = 1800;
    review.share_basis_points = 2000;
    review.rate_minor = Some(12_345);
    review.currency = Some("PLN".to_string());
    review.rate_status = ReportRateStatus::Inherited;
    review.amount_minor = Some(6_173);
    backend.subtasks = vec![review];

    let mut docs = a_task();
    docs.id = "t-docs".to_string();
    docs.name = "=HYPERLINK(\"http://evil.test\")".to_string();
    docs.seconds = 3001;
    docs.direct_seconds = 3001;
    docs.share_basis_points = 3333;
    docs.rate_minor = None;
    docs.currency = None;
    docs.rate_status = ReportRateStatus::Unconfigured;
    docs.amount_minor = None;
    docs.subtasks = vec![];
    alpha.tasks = vec![backend, docs];

    let mut beta = a_project();
    beta.id = "p-beta".to_string();
    beta.name = "Internal".to_string();
    beta.direct_seconds = 0;
    let mut meeting = a_task();
    meeting.id = "t-meeting".to_string();
    meeting.name = "Standup".to_string();
    meeting.seconds = 900;
    meeting.direct_seconds = 900;
    meeting.share_basis_points = 500;
    meeting.rate_minor = Some(0);
    meeting.currency = Some("EUR".to_string());
    meeting.rate_status = ReportRateStatus::NonBillable;
    meeting.amount_minor = Some(0);
    meeting.subtasks = vec![];
    beta.tasks = vec![meeting];

    document.projects = vec![alpha, beta];
    document
}

fn full_golden_document() -> ReportDocument {
    let mut document = a_document(ReportVariant::Full);

    let mut formula = an_entry();
    formula.id = "log-1".to_string();
    formula.project_name = "Zażółć gęślą jaźń".to_string();
    formula.task_name = Some("Backend, API \"v2\"".to_string());
    formula.note = Some("=SUM(A1)".to_string());
    formula.amount_minor = Some(1_234_567);

    let mut patch = a_project_patch_entry();
    patch.id = "log-2".to_string();
    patch.project_name = "Zażółć gęślą jaźń".to_string();
    patch.date = "2026-01-02".to_string();
    patch.start = "2026-01-02T09:00:00Z".to_string();
    patch.end = Some("2026-01-02T09:10:00Z".to_string());
    patch.seconds = 600;
    patch.note = Some("first line\nsecond line".to_string());
    patch.rate_minor = None;
    patch.currency = None;
    patch.amount_minor = None;

    let mut running = an_entry();
    running.id = "log-3".to_string();
    running.date = "2026-01-03".to_string();
    running.start = "2026-01-03T08:00:00Z".to_string();
    running.end = None;
    running.seconds = 90;
    running.note = None;
    running.rate_minor = None;
    running.currency = None;
    running.amount_minor = None;

    document.entries = Some(vec![formula, patch, running]);
    document
}

fn flatten(csv: &str) -> Vec<&str> {
    csv.lines().collect()
}

#[test]
fn test_given_summary_document_when_writing_csv_then_matches_golden_file() {
    // Arrange
    let document = summary_golden_document();

    // Act
    let csv = render_text(&document, CsvOptions::default());

    // Assert
    assert_eq!(csv, golden(SUMMARY_GOLDEN));
}

#[test]
fn test_given_full_document_when_writing_csv_then_matches_golden_file() {
    // Arrange
    let document = full_golden_document();

    // Act
    let csv = render_text(&document, CsvOptions::default());

    // Assert
    assert_eq!(csv, golden(FULL_GOLDEN));
}

#[test]
fn test_given_polish_names_and_bom_option_when_writing_csv_then_bytes_start_with_utf8_bom() {
    // Arrange
    let document = summary_golden_document();
    let options = CsvOptions {
        bom: true,
        ..CsvOptions::default()
    };

    // Act
    let bytes = render(&document, options);

    // Assert
    assert_eq!(&bytes[..3], &[0xEF, 0xBB, 0xBF]);
    let text = String::from_utf8(bytes[3..].to_vec()).expect("payload after BOM is UTF-8");
    assert!(text.contains("Zażółć gęślą jaźń"));
    assert!(text.starts_with("projectId,"));
}

#[test]
fn test_given_default_options_when_writing_csv_then_output_has_no_bom() {
    // Arrange
    let document = summary_golden_document();

    // Act
    let bytes = render(&document, CsvOptions::default());

    // Assert
    assert_eq!(&bytes[..3], b"pro");
}

#[test]
fn test_given_formula_in_note_when_writing_full_csv_then_cell_gets_apostrophe_prefix() {
    // Arrange
    let mut document = a_document(ReportVariant::Full);
    let mut entry = an_entry();
    entry.note = Some("=SUM(A1)".to_string());
    document.entries = Some(vec![entry]);

    // Act
    let csv = render_text(&document, CsvOptions::default());

    // Assert
    assert!(csv.contains(",'=SUM(A1),"), "{csv}");
}

#[test]
fn test_given_formula_triggers_in_names_when_writing_summary_csv_then_every_text_cell_is_neutralized(
) {
    // Arrange
    let mut document = a_document(ReportVariant::Summary);
    document.projects[0].name = "+cmd|' /C calc'!A0".to_string();
    document.projects[0].tasks[0].name = "-evil".to_string();
    document.projects[0].tasks[0].subtasks[0].name = "@SUM(A1)".to_string();

    // Act
    let csv = render_text(&document, CsvOptions::default());

    // Assert
    assert!(csv.contains("'+cmd|' /C calc'!A0"));
    assert!(csv.contains(",'-evil,"));
    assert!(csv.contains(",'@SUM(A1),"));
}

#[test]
fn test_given_semicolon_delimiter_when_writing_csv_then_columns_split_on_semicolon_and_commas_stay_unquoted(
) {
    // Arrange
    let mut document = a_document(ReportVariant::Summary);
    document.projects[0].name = "Alpha, Beta".to_string();
    document.projects[0].tasks[0].name = "Plan; review".to_string();
    let options = CsvOptions {
        delimiter: CsvDelimiter::Semicolon,
        bom: false,
    };

    // Act
    let csv = render_text(&document, options);

    // Assert
    let lines = flatten(&csv);
    assert!(lines[0].starts_with("projectId;projectName;taskId;"));
    assert!(lines[1].starts_with("p1;Alpha, Beta;t1;\"Plan; review\";;3600;"));
}

#[test]
fn test_given_tab_delimiter_when_writing_csv_then_columns_split_on_tab() {
    // Arrange
    let document = a_document(ReportVariant::Summary);
    let options = CsvOptions {
        delimiter: CsvDelimiter::Tab,
        bom: false,
    };

    // Act
    let csv = render_text(&document, options);

    // Assert
    let header = flatten(&csv)[0].to_string();
    assert_eq!(header.split('\t').count(), 13);
    assert!(!header.contains(','));
}

#[test]
fn test_given_summary_document_when_writing_csv_then_rows_follow_document_order() {
    // Arrange
    let document = summary_golden_document();

    // Act
    let csv = render_text(&document, CsvOptions::default());

    // Assert
    let lines = flatten(&csv);
    assert_eq!(
        lines.len(),
        6,
        "header, project time, two alpha tasks, subtask, beta task"
    );
    assert!(lines[0].starts_with("projectId,projectName,taskId,taskName,parentTaskId,seconds,"));
    assert!(lines[2].starts_with("p-alpha,Zażółć gęślą jaźń,t-backend,"));
}

#[test]
fn test_given_task_with_subtasks_when_writing_summary_csv_then_subtask_follows_its_parent_with_parent_id(
) {
    // Arrange
    let document = a_document(ReportVariant::Summary);

    // Act
    let csv = render_text(&document, CsvOptions::default());

    // Assert
    let lines = flatten(&csv);
    assert_eq!(lines.len(), 3);
    assert!(lines[1].starts_with("p1,Project,t1,Task,,3600,0,1.00,10000,"));
    assert!(lines[2]
        .starts_with("p1,Project,t2,Subtask,t1,3600,3600,1.00,10000,150.00,150.00,PLN,custom"));
}

#[test]
fn test_given_project_level_time_when_writing_summary_csv_then_row_without_task_carries_it() {
    // Arrange
    let mut document = a_document(ReportVariant::Summary);
    document.projects[0].direct_seconds = 1800;

    // Act
    let csv = render_text(&document, CsvOptions::default());

    // Assert
    assert_eq!(flatten(&csv)[1], "p1,Project,,,,1800,1800,0.50,,,,,");
}

#[test]
fn test_given_unconfigured_rate_when_writing_summary_csv_then_money_cells_are_empty() {
    // Arrange
    let mut document = a_document(ReportVariant::Summary);
    document.projects[0].tasks[0].subtasks = vec![];

    // Act
    let csv = render_text(&document, CsvOptions::default());

    // Assert
    assert_eq!(
        flatten(&csv)[1],
        "p1,Project,t1,Task,,3600,0,1.00,10000,,,,unconfigured"
    );
}

#[test]
fn test_given_large_amount_when_writing_full_csv_then_decimal_uses_dot_without_grouping() {
    // Arrange
    let mut document = a_document(ReportVariant::Full);
    let mut entry = an_entry();
    entry.amount_minor = Some(1_234_567);
    document.entries = Some(vec![entry]);

    // Act
    let csv = render_text(&document, CsvOptions::default());

    // Assert
    assert!(csv.contains(",12345.67,PLN"), "{csv}");
}

#[test]
fn test_given_seconds_when_writing_summary_csv_then_hours_have_two_decimals_rounded_half_up() {
    // Arrange
    let cases = [
        (0_u64, "0.00"),
        (1, "0.00"),
        (18, "0.01"),
        (3000, "0.83"),
        (3601, "1.00"),
        (5400, "1.50"),
        (360_000, "100.00"),
    ];

    for (seconds, expected) in cases {
        let mut document = a_document(ReportVariant::Summary);
        document.projects[0].tasks[0].seconds = seconds;
        document.projects[0].tasks[0].subtasks = vec![];

        // Act
        let csv = render_text(&document, CsvOptions::default());

        // Assert
        let cells: Vec<&str> = flatten(&csv)[1].split(',').collect();
        assert_eq!(cells[7], expected, "{seconds}s");
    }
}

#[test]
fn test_given_task_less_and_running_entries_when_writing_full_csv_then_missing_cells_are_empty() {
    // Arrange
    let document = full_golden_document();

    // Act
    let csv = render_text(&document, CsvOptions::default());

    // Assert
    let lines = flatten(&csv);
    assert!(lines.iter().any(
        |l| l.starts_with("log-3,p1,Project,t2,Subtask,2026-01-03,2026-01-03T08:00:00Z,,90,,,")
    ));
}

#[test]
fn test_given_empty_documents_when_writing_csv_then_only_the_header_is_written() {
    // Arrange
    let mut summary = a_document(ReportVariant::Summary);
    summary.projects = vec![];
    let mut full = a_document(ReportVariant::Full);
    full.entries = Some(vec![]);

    // Act
    let summary_csv = render_text(&summary, CsvOptions::default());
    let full_csv = render_text(&full, CsvOptions::default());

    // Assert
    assert_eq!(flatten(&summary_csv).len(), 1);
    assert_eq!(flatten(&full_csv).len(), 1);
}

#[test]
fn test_given_projects_in_document_order_when_writing_csv_then_rows_keep_that_order() {
    // Arrange
    let mut document = a_document(ReportVariant::Summary);
    let mut zulu = a_project();
    zulu.id = "p-zulu".to_string();
    let mut alpha = a_project();
    alpha.id = "p-alpha".to_string();
    document.projects = vec![zulu, alpha];

    // Act
    let csv = render_text(&document, CsvOptions::default());

    // Assert
    assert!(csv.find("p-zulu").unwrap() < csv.find("p-alpha").unwrap());
}

#[test]
fn test_given_delimiter_spellings_when_parsing_then_accepts_comma_semicolon_and_tab() {
    // Arrange
    let accepted = [
        (",", CsvDelimiter::Comma),
        (";", CsvDelimiter::Semicolon),
        ("\t", CsvDelimiter::Tab),
        ("\\t", CsvDelimiter::Tab),
        ("tab", CsvDelimiter::Tab),
        ("TAB", CsvDelimiter::Tab),
    ];

    for (raw, expected) in accepted {
        // Act
        let parsed = CsvDelimiter::parse(raw);

        // Assert
        assert_eq!(parsed.expect(raw), expected);
    }
}

#[test]
fn test_given_unsupported_delimiters_when_parsing_then_returns_syntax_error_exit_2() {
    // Arrange
    let rejected = ["|", ":", ";;", "", " ", "comma"];

    for raw in rejected {
        // Act
        let error = CsvDelimiter::parse(raw).unwrap_err();

        // Assert
        assert_eq!(error.exit_code(), 2, "{raw:?}");
        match error {
            CliError::Syntax(CliSyntaxError::InvalidArgument { field, value, .. }) => {
                assert_eq!(field.as_deref(), Some("--csv-delimiter"));
                assert_eq!(value.as_deref(), Some(raw));
            }
            other => panic!("expected an invalid argument, got {other:?}"),
        }
    }
}

#[test]
fn test_given_csv_flags_with_other_formats_when_resolving_options_then_returns_syntax_error_exit_2()
{
    // Arrange
    let formats = [
        ExportFormat::Table,
        ExportFormat::Html,
        ExportFormat::Json,
        ExportFormat::Xml,
        ExportFormat::Ods,
        ExportFormat::Xlsx,
    ];

    for format in formats {
        // Act
        let bom = ExportOptions::resolve(format, None, true).unwrap_err();
        let delimiter = ExportOptions::resolve(format, Some(";"), false).unwrap_err();

        // Assert
        assert_eq!(bom.exit_code(), 2, "{format:?}");
        assert_eq!(delimiter.exit_code(), 2, "{format:?}");
    }
}

#[test]
fn test_given_csv_format_when_resolving_options_then_flags_are_carried_into_the_csv_options() {
    // Arrange
    let format = ExportFormat::Csv;

    // Act
    let options = ExportOptions::resolve(format, Some("tab"), true).expect("valid options");
    let defaults = ExportOptions::resolve(format, None, false).expect("defaults");

    // Assert
    assert_eq!(options.csv.delimiter, CsvDelimiter::Tab);
    assert!(options.csv.bom);
    assert_eq!(defaults, ExportOptions::default());
    assert_eq!(defaults.csv.delimiter, CsvDelimiter::Comma);
    assert!(!defaults.csv.bom);
}

#[test]
fn test_given_registry_writer_when_exporting_csv_with_options_then_applies_delimiter_and_bom() {
    // Arrange
    let document = a_document(ReportVariant::Summary);
    let options = ExportOptions {
        csv: CsvOptions {
            delimiter: CsvDelimiter::Semicolon,
            bom: true,
        },
    };

    // Act
    let bytes = export_to_bytes_with_options(&document, ExportFormat::Csv, &options).expect("csv");

    // Assert
    assert_eq!(&bytes[..3], &[0xEF, 0xBB, 0xBF]);
    assert!(String::from_utf8_lossy(&bytes[3..]).starts_with("projectId;projectName;"));
}

#[test]
fn test_given_formula_triggers_when_sanitize_csv_formula_then_neutralizes_with_apostrophe() {
    assert_eq!(sanitize_csv_formula("=1+1"), "'=1+1");
    assert_eq!(sanitize_csv_formula("@SUM(A1:A2)"), "'@SUM(A1:A2)");
    assert_eq!(
        sanitize_csv_formula("+cmd|' /C calc'!A0"),
        "'+cmd|' /C calc'!A0"
    );
    assert_eq!(sanitize_csv_formula("-calc"), "'-calc");
}

#[test]
fn test_given_leading_whitespace_and_control_chars_when_sanitize_csv_formula_then_neutralizes() {
    assert_eq!(sanitize_csv_formula("   =1+1"), "'   =1+1");
    assert_eq!(sanitize_csv_formula("\t@SUM(A1:A2)"), "'\t@SUM(A1:A2)");
    assert_eq!(
        sanitize_csv_formula("\r\n+cmd|' /C calc'!A0"),
        "'\r\n+cmd|' /C calc'!A0"
    );
    assert_eq!(sanitize_csv_formula("\x00-calc"), "'\x00-calc");
}

#[test]
fn test_given_plain_text_and_empty_values_when_sanitize_csv_formula_then_leaves_unchanged() {
    assert_eq!(sanitize_csv_formula(""), "");
    assert_eq!(sanitize_csv_formula("   "), "   ");
    assert_eq!(sanitize_csv_formula("Regular Project"), "Regular Project");
    assert_eq!(sanitize_csv_formula("Task #42"), "Task #42");
    assert_eq!(sanitize_csv_formula("Alpha & Omega"), "Alpha & Omega");
}

#[test]
fn test_given_numeric_values_including_negatives_when_sanitize_csv_formula_then_preserves_numbers()
{
    assert_eq!(sanitize_csv_formula("123"), "123");
    assert_eq!(sanitize_csv_formula("+123"), "+123");
    assert_eq!(sanitize_csv_formula("-123"), "-123");
    assert_eq!(sanitize_csv_formula("-123.45"), "-123.45");
    assert_eq!(sanitize_csv_formula("+42.0"), "+42.0");
    assert_eq!(sanitize_csv_formula("0"), "0");
    assert_eq!(sanitize_csv_formula("-0"), "-0");
    assert_eq!(sanitize_csv_formula(".5"), ".5");
    assert_eq!(sanitize_csv_formula("-.5"), "-.5");
    assert_eq!(sanitize_csv_formula("1e5"), "1e5");
    assert_eq!(sanitize_csv_formula("-1e-3"), "-1e-3");
}
