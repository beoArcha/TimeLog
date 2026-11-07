use oxyflow_timelog::cli::error::{CliError, CliSyntaxError};
use oxyflow_timelog::cli::exporters::schema::{get_report_xml_schema, REPORT_XML_SCHEMA_V1};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_given_schema_constant_when_inspected_then_contains_valid_prolog_and_xml_schema_definitions()
{
    // Assert: REPORT_XML_SCHEMA_V1 is not empty
    assert!(!REPORT_XML_SCHEMA_V1.trim().is_empty());

    // Assert: contains correct XML prolog
    assert!(REPORT_XML_SCHEMA_V1.starts_with("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));

    // Assert: contains XML schema root element with W3C namespace
    assert!(REPORT_XML_SCHEMA_V1.contains("<xs:schema"));
    assert!(REPORT_XML_SCHEMA_V1.contains("xmlns:xs=\"http://www.w3.org/2001/XMLSchema\""));

    // Assert: contains schemaVersion attribute fixed to "1"
    assert!(REPORT_XML_SCHEMA_V1.contains("name=\"schemaVersion\""));
    assert!(REPORT_XML_SCHEMA_V1.contains("fixed=\"1\""));

    // Assert: contains report element definition
    assert!(REPORT_XML_SCHEMA_V1.contains("<xs:element name=\"report\">"));
}

#[test]
fn test_given_version_1_when_resolving_schema_then_returns_canonical_v1() {
    let schema = get_report_xml_schema("1").expect("version 1 must be supported");
    assert_eq!(schema, REPORT_XML_SCHEMA_V1);
}

#[test]
fn test_given_unsupported_version_when_resolving_schema_then_returns_cli_syntax_error() {
    let result = get_report_xml_schema("2");
    assert!(result.is_err());
    match result.unwrap_err() {
        CliError::Syntax(CliSyntaxError::InvalidArgs(msg)) => {
            assert!(msg.contains("Unsupported XML schema version: '2'"));
            assert!(msg.contains("Supported versions: '1'"));
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
        .join("v1")
        .join("report.xsd");

    let source_bytes = fs::read(&schema_path).unwrap_or_else(|e| {
        panic!("Failed to read schema file at {:?}: {}", schema_path, e);
    });

    assert_eq!(
        REPORT_XML_SCHEMA_V1.as_bytes(),
        source_bytes.as_slice(),
        "Embedded REPORT_XML_SCHEMA_V1 in Rust must be byte-for-byte identical to schemas/xml/report/v1/report.xsd"
    );
}
