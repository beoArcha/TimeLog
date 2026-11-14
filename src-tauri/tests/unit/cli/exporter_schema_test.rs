use oxyflow_timelog::cli::error::{CliError, CliSyntaxError};
use oxyflow_timelog::cli::exporters::schema::{get_report_xml_schema, REPORT_XML_SCHEMA_V2};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_given_schema_constant_when_inspected_then_contains_valid_prolog_and_xml_schema_definitions()
{
    // Assert: REPORT_XML_SCHEMA_V2 is not empty
    assert!(!REPORT_XML_SCHEMA_V2.trim().is_empty());

    // Assert: contains correct XML prolog
    assert!(REPORT_XML_SCHEMA_V2.starts_with("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));

    // Assert: contains XML schema root element with W3C namespace
    assert!(REPORT_XML_SCHEMA_V2.contains("<xs:schema"));
    assert!(REPORT_XML_SCHEMA_V2.contains("xmlns:xs=\"http://www.w3.org/2001/XMLSchema\""));

    // Assert: contains schemaVersion attribute fixed to "2"
    assert!(REPORT_XML_SCHEMA_V2.contains("name=\"schemaVersion\""));
    assert!(REPORT_XML_SCHEMA_V2.contains("fixed=\"2\""));

    // Assert: contains the variant attribute and the report element definition
    assert!(REPORT_XML_SCHEMA_V2.contains("name=\"variant\""));
    assert!(REPORT_XML_SCHEMA_V2.contains("<xs:element name=\"report\" type=\"ReportType\"/>"));
}

#[test]
fn test_given_version_2_when_resolving_schema_then_returns_canonical_v2() {
    let schema = get_report_xml_schema("2").expect("version 2 must be supported");
    assert_eq!(schema, REPORT_XML_SCHEMA_V2);
}

#[test]
fn test_given_unsupported_version_when_resolving_schema_then_returns_cli_syntax_error() {
    let result = get_report_xml_schema("1");
    assert!(result.is_err());
    match result.unwrap_err() {
        CliError::Syntax(CliSyntaxError::InvalidArgs(msg)) => {
            assert!(msg.contains("Unsupported XML schema version: '1'"));
            assert!(msg.contains("Supported versions: '2'"));
        }
        other => panic!("expected CliSyntaxError::InvalidArgs, got {:?}", other),
    }

    let empty_res = get_report_xml_schema("");
    assert!(empty_res.is_err());
}

#[test]
fn test_given_source_file_when_comparing_with_embedded_schema_then_bytes_are_identical() {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let schema_path = manifest_dir
        .parent()
        .expect("manifest_dir should have parent repository directory")
        .join("schemas")
        .join("xml")
        .join("report")
        .join("v2")
        .join("report.xsd");

    let source_bytes = fs::read(&schema_path).unwrap_or_else(|e| {
        panic!("Failed to read schema file at {:?}: {}", schema_path, e);
    });

    assert_eq!(
        REPORT_XML_SCHEMA_V2.as_bytes(),
        source_bytes.as_slice(),
        "Embedded REPORT_XML_SCHEMA_V2 in Rust must be byte-for-byte identical to schemas/xml/report/v2/report.xsd"
    );
}

#[test]
fn test_given_schema_content_when_export_schema_to_file_then_creates_file_and_parents() {
    use oxyflow_timelog::cli::exporters::schema::export_schema_to_file;

    let temp_dir = tempfile::tempdir().expect("create temp dir");
    let target = temp_dir
        .path()
        .join("nested")
        .join("sub")
        .join("report.xsd");
    let target_str = target.to_str().unwrap();

    let res = export_schema_to_file(REPORT_XML_SCHEMA_V2, target_str);
    assert!(res.is_ok());
    assert!(target.exists());

    let content = fs::read_to_string(&target).expect("read written file");
    assert_eq!(content, REPORT_XML_SCHEMA_V2);
}

#[test]
fn test_given_invalid_path_when_export_schema_to_file_then_returns_sink_io_error() {
    use oxyflow_timelog::cli::exporters::schema::export_schema_to_file;

    let invalid_path = if cfg!(windows) {
        "Z:\\non_existent_drive_xyz\\report.xsd"
    } else {
        "/non_existent_dir_xyz/deeply/nested/report.xsd"
    };

    let res = export_schema_to_file(REPORT_XML_SCHEMA_V2, invalid_path);
    assert!(res.is_err());
    let err = res.unwrap_err();
    assert_eq!(err.exit_code(), 1);
    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "SNK_EXTERNAL_IO");
}
