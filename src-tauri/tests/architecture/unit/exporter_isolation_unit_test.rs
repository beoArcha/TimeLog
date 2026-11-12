use crate::architecture::rules::exporter_isolation::{
    assert_exporter_isolation, detect_forbidden_exporter_import, find_exporter_violations_in_file,
    find_exporter_violations_in_source,
};
use std::path::Path;

#[test]
fn test_given_clean_exporter_source_when_checked_then_zero_violations_detected() {
    // Given
    let source = r#"
        use super::constants::REPORT_COLUMN_HEADERS;
        use super::rows::flatten_report;
        use crate::cli::error::CliError;
        use crate::cli::formatters::ReportTreeDto;
        use std::io::Write;

        pub fn export_csv<W: Write>(dto: &ReportTreeDto, writer: &mut W) -> Result<(), CliError> {
            let rows = flatten_report(dto);
            for row in rows {
                writeln!(writer, "{},{}", row.project_name, row.task_name)?;
            }
            Ok(())
        }
    "#;
    let file = Path::new("src/cli/exporters/csv.rs");

    // When
    let violations = find_exporter_violations_in_source(source, file);

    // Then
    assert!(
        violations.is_empty(),
        "Expected 0 violations, found: {:?}",
        violations
    );
}

#[test]
fn test_given_single_line_grouped_import_with_engine_when_checked_then_detects_violation() {
    // Given
    let source = "use crate::{engine::Engine, types::Foo};";
    let file = Path::new("src/cli/exporters/csv.rs");

    // When
    let violations = find_exporter_violations_in_source(source, file);

    // Then
    assert_eq!(violations.len(), 1);
    assert!(violations[0].contains("crate::engine"));
}

#[test]
fn test_given_multi_line_grouped_import_with_persistence_when_checked_then_detects_violation() {
    // Given
    let source = r#"
        use crate::{
            persistence::SqliteRepository,
            types::ReportTreeDto,
        };
    "#;
    let file = Path::new("src/cli/exporters/html.rs");

    // When
    let violations = find_exporter_violations_in_source(source, file);

    // Then
    assert_eq!(violations.len(), 1);
    assert!(violations[0].contains("crate::persistence"));
}

#[test]
fn test_given_grouped_import_of_only_types_and_exporter_siblings_when_checked_then_zero_violations()
{
    // Given
    let source = r#"
        use crate::{
            cli::exporters::constants::REPORT_COLUMN_HEADERS,
            types::ReportTreeDto,
        };
    "#;
    let file = Path::new("src/cli/exporters/json.rs");

    // When
    let violations = find_exporter_violations_in_source(source, file);

    // Then
    assert!(
        violations.is_empty(),
        "Expected 0 violations, found: {:?}",
        violations
    );
}

#[test]
fn test_given_engine_like_name_reference_when_checked_then_does_not_match_forbidden_engine() {
    // Given
    let source = r#"
        use crate::engine_like_name::EngineLikeService;
        let x = crate::engine_like_name::calculate();
    "#;
    let file = Path::new("src/cli/exporters/xlsx.rs");

    // When
    let violations = find_exporter_violations_in_source(source, file);

    // Then
    assert!(
        violations.is_empty(),
        "Expected 0 violations for engine_like_name, found: {:?}",
        violations
    );
}

#[test]
fn test_given_unreadable_file_when_checked_then_reports_read_error_violation() {
    // Given
    let unreadable = Path::new("src/cli/exporters/nonexistent_dummy_file.rs");

    // When
    let violations = find_exporter_violations_in_file(unreadable);

    // Then
    assert_eq!(violations.len(), 1);
    assert!(violations[0].contains("could not be read"));
}

#[test]
fn test_given_empty_or_missing_exporters_directory_when_checked_then_panics_with_clear_message() {
    // Given
    let temp_dir = tempfile::tempdir().expect("Failed to create temporary directory");

    // When
    let result = std::panic::catch_unwind(|| {
        assert_exporter_isolation(temp_dir.path());
    });

    // Then
    assert!(
        result.is_err(),
        "Expected panic on empty exporters directory"
    );
}

#[test]
fn test_given_use_crate_persistence_when_checked_then_detects_forbidden_import() {
    // Given
    let source = "use crate::persistence::SqliteRepository;";
    let file = Path::new("src/cli/exporters/csv.rs");

    // When
    let violations = find_exporter_violations_in_source(source, file);

    // Then
    assert_eq!(violations.len(), 1);
    assert!(violations[0].contains("crate::persistence"));
}

#[test]
fn test_given_use_crate_repositories_when_checked_then_detects_forbidden_import() {
    // Given
    let source = "use crate::repositories::ProjectRepository;";
    let file = Path::new("src/cli/exporters/html.rs");

    // When
    let violations = find_exporter_violations_in_source(source, file);

    // Then
    assert_eq!(violations.len(), 1);
    assert!(violations[0].contains("crate::repositories"));
}

#[test]
fn test_given_use_crate_engine_when_checked_then_detects_forbidden_import() {
    // Given
    let source = "use crate::engine::calculate_elapsed;";
    let file = Path::new("src/cli/exporters/json.rs");

    // When
    let violations = find_exporter_violations_in_source(source, file);

    // Then
    assert_eq!(violations.len(), 1);
    assert!(violations[0].contains("crate::engine"));
}

#[test]
fn test_given_use_rusqlite_when_checked_then_detects_forbidden_import() {
    // Given
    let source = "use rusqlite::Connection;";
    let file = Path::new("src/cli/exporters/xlsx.rs");

    // When
    let violations = find_exporter_violations_in_source(source, file);

    // Then
    assert_eq!(violations.len(), 1);
    assert!(violations[0].contains("rusqlite"));
}

#[test]
fn test_given_use_crate_cli_handlers_when_checked_then_detects_forbidden_import() {
    // Given
    let source = "use crate::cli::handlers::export_handler;";
    let file = Path::new("src/cli/exporters/xml.rs");

    // When
    let violations = find_exporter_violations_in_source(source, file);

    // Then
    assert_eq!(violations.len(), 1);
    assert!(violations[0].contains("crate::cli::handlers"));
}

#[test]
fn test_given_path_reference_in_expression_when_checked_then_detects_forbidden_access() {
    // Given
    let sample_engine = "let _ = crate::engine::Engine::new();";
    let sample_rusqlite = "let _ = rusqlite::params![];";
    let sample_persistence = "crate::persistence::init_db();";
    let sample_repositories = "crate::repositories::get_all();";
    let sample_handlers = "crate::cli::handlers::run();";

    // When
    let detected_engine = detect_forbidden_exporter_import(sample_engine);
    let detected_rusqlite = detect_forbidden_exporter_import(sample_rusqlite);
    let detected_persistence = detect_forbidden_exporter_import(sample_persistence);
    let detected_repositories = detect_forbidden_exporter_import(sample_repositories);
    let detected_handlers = detect_forbidden_exporter_import(sample_handlers);

    // Then
    assert_eq!(detected_engine, Some("crate::engine"));
    assert_eq!(detected_rusqlite, Some("rusqlite"));
    assert_eq!(detected_persistence, Some("crate::persistence"));
    assert_eq!(detected_repositories, Some("crate::repositories"));
    assert_eq!(detected_handlers, Some("crate::cli::handlers"));
}

#[test]
fn test_given_commented_code_or_docstrings_when_checked_then_ignores_comments() {
    // Given
    let source = r#"
        //! Furthermore, spreadsheet engines strip or ignore leading whitespace.
        // use rusqlite::Connection;
        // crate::persistence::save();
        /* crate::engine::calculate(); */
        pub fn clean_fn() {}
    "#;
    let file = Path::new("src/cli/exporters/ods.rs");

    // When
    let violations = find_exporter_violations_in_source(source, file);

    // Then
    assert!(
        violations.is_empty(),
        "Expected 0 violations in commented code, got: {:?}",
        violations
    );
}
