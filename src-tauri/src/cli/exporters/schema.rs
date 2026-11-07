use crate::cli::error::CliError;

pub const REPORT_XML_SCHEMA_V1: &str = include_str!("../../../../schemas/xml/report/v1/report.xsd");

/// Returns the XML schema for the specified report schema version.
///
/// Currently supported version(s):
/// - `"1"`: Canonical XML Schema v1 (`REPORT_XML_SCHEMA_V1`)
pub fn get_report_xml_schema(version: &str) -> Result<&'static str, CliError> {
    match version {
        "1" => Ok(REPORT_XML_SCHEMA_V1),
        unsupported => Err(CliError::syntax_invalid_args(format!(
            "Unsupported XML schema version: '{}'. Supported versions: '1'",
            unsupported
        ))),
    }
}
