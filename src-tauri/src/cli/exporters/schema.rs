use crate::cli::error::CliError;
use crate::cli::exporters::constants::ERR_UNSUPPORTED_SCHEMA_VERSION;
use crate::cli::exporters::sink_io_error;

pub const REPORT_XML_SCHEMA_V1: &str = include_str!("../../../../schemas/xml/report/v1/report.xsd");

/// Returns the XML schema for the specified report schema version.
///
/// Currently supported version(s):
/// - `"1"`: Canonical XML Schema v1 (`REPORT_XML_SCHEMA_V1`)
pub fn get_report_xml_schema(version: &str) -> Result<&'static str, CliError> {
    match version {
        "1" => Ok(REPORT_XML_SCHEMA_V1),
        unsupported => Err(CliError::syntax_invalid_args(
            ERR_UNSUPPORTED_SCHEMA_VERSION.replacen("{}", unsupported, 1),
        )),
    }
}

use std::io::Write;

/// Safely writes the report XML schema content to the target file path using atomic writes.
///
/// Creates any required parent directories automatically and handles I/O errors
/// via `sink_io_error` with `SNK_EXTERNAL_IO` error classification.
pub fn export_schema_to_file(schema_content: &str, output_path: &str) -> Result<(), CliError> {
    super::atomic_write_to_file(output_path, |writer| {
        writer.write_all(schema_content.as_bytes()).map_err(|e| {
            sink_io_error(
                &format!("Failed to write export file to {}", output_path),
                e,
            )
        })
    })
}
