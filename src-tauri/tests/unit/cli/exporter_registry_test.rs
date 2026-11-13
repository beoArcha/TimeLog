use crate::shared::exporter_fixtures::create_sample_document;
use clap::ValueEnum;
use oxyflow_timelog::cli::error::{CliError, CliSyntaxError};
use oxyflow_timelog::cli::exporters::{
    export_to_bytes, format_name, format_spec, registry, FormatGroup,
};
use oxyflow_timelog::cli::parser::{ExportFormat, ReportVariantArg};
use oxyflow_timelog::types::ReportVariant;

#[test]
fn test_given_every_export_format_when_looking_up_the_registry_then_each_has_exactly_one_entry() {
    // Arrange
    let formats = ExportFormat::value_variants();

    // Act
    let entry_counts: Vec<(ExportFormat, usize)> = formats
        .iter()
        .map(|format| {
            let count = registry()
                .iter()
                .filter(|spec| spec.format == *format)
                .count();
            (*format, count)
        })
        .collect();

    // Assert
    for (format, count) in entry_counts {
        assert_eq!(count, 1, "{format:?} must have exactly one registry entry");
    }
    assert_eq!(registry().len(), formats.len());
}

#[test]
fn test_given_registry_when_reading_groups_and_binary_flags_then_matches_the_format_table() {
    // Arrange
    let expected = [
        (ExportFormat::Table, FormatGroup::Human, false),
        (ExportFormat::Html, FormatGroup::Human, false),
        (ExportFormat::Csv, FormatGroup::Data, false),
        (ExportFormat::Json, FormatGroup::Data, false),
        (ExportFormat::Xml, FormatGroup::Data, false),
        (ExportFormat::Ods, FormatGroup::Data, true),
        (ExportFormat::Xlsx, FormatGroup::Data, true),
    ];

    for (format, group, binary) in expected {
        // Act
        let spec = format_spec(format).expect("registered format");

        // Assert
        assert_eq!(spec.group, group, "{format:?}");
        assert_eq!(spec.binary, binary, "{format:?}");
        assert!(!spec.locale_dependent, "{format:?}");
    }
}

#[test]
fn test_given_xml_format_when_requesting_the_summary_variant_then_fails_with_a_syntax_error_naming_both(
) {
    // Arrange
    let spec = format_spec(ExportFormat::Xml).expect("registered format");

    // Act
    let result = spec.ensure_supports(ReportVariantArg::Summary);

    // Assert
    match result {
        Err(CliError::Syntax(CliSyntaxError::InvalidArgument {
            message,
            field,
            value,
        })) => {
            assert!(message.contains("'xml'"), "{message}");
            assert!(message.contains("'summary'"), "{message}");
            assert_eq!(field.as_deref(), Some("--variant"));
            assert_eq!(value.as_deref(), Some("summary"));
        }
        other => panic!("expected an invalid-argument syntax error, got {other:?}"),
    }
}

#[test]
fn test_given_json_format_when_requesting_each_variant_then_both_are_supported() {
    // Arrange
    let spec = format_spec(ExportFormat::Json).expect("registered format");

    // Act
    let full = spec.ensure_supports(ReportVariantArg::Full);
    let summary = spec.ensure_supports(ReportVariantArg::Summary);

    // Assert
    assert!(full.is_ok());
    assert!(summary.is_ok());
}

#[test]
fn test_given_binary_formats_when_checking_for_stdout_then_only_they_are_refused() {
    for format in ExportFormat::value_variants() {
        // Arrange
        let spec = format_spec(*format).expect("registered format");

        // Act
        let result = spec.ensure_text();

        // Assert
        assert_eq!(result.is_err(), spec.binary, "{}", format_name(*format));
    }
}

#[test]
fn test_given_the_same_document_when_exporting_json_and_csv_twice_then_bytes_are_identical() {
    // Arrange
    let document = create_sample_document(ReportVariant::Full);

    for format in [ExportFormat::Json, ExportFormat::Csv] {
        // Act
        let first = export_to_bytes(&document, format).expect("first export");
        let second = export_to_bytes(&document, format).expect("second export");

        // Assert
        assert_eq!(first, second, "{format:?}");
    }
}

#[test]
fn test_given_projects_with_equal_seconds_when_exporting_csv_then_rows_keep_document_order() {
    // Arrange
    let mut document = create_sample_document(ReportVariant::Full);
    let mut zulu = document.projects[0].clone();
    zulu.id = "p-zulu".to_string();
    zulu.name = "Zulu".to_string();
    let mut alpha = document.projects[0].clone();
    alpha.id = "p-alpha".to_string();
    alpha.name = "Alpha".to_string();
    document.projects = vec![zulu, alpha];

    // Act
    let csv = String::from_utf8(export_to_bytes(&document, ExportFormat::Csv).expect("csv"))
        .expect("utf8");

    // Assert
    let zulu_at = csv.find("\"Zulu\"").expect("Zulu row");
    let alpha_at = csv.find("\"Alpha\"").expect("Alpha row");
    assert!(
        zulu_at < alpha_at,
        "exporters must not re-sort the document"
    );
}

#[test]
fn test_given_table_format_when_exporting_then_writes_the_tree_with_a_trailing_newline() {
    // Arrange
    let document = create_sample_document(ReportVariant::Summary);

    // Act
    let bytes = export_to_bytes(&document, ExportFormat::Table).expect("table");

    // Assert
    let text = String::from_utf8(bytes).expect("utf8");
    assert!(text.contains("Database Setup"));
    assert!(text.ends_with('\n'));
}
