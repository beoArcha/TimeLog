use crate::cli::error::CliError;
use crate::cli::exporters::constants::MSG_SCHEMA_EXPORT_SUCCESS;
use crate::cli::exporters::schema::{export_schema_to_file, get_report_xml_schema};
use crate::cli::shared::output::CliOutput;

/// Handles the `oxy report schema` CLI command.
///
/// If `output` is None, prints the raw XSD schema directly to stdout via `CliOutput::Raw`.
/// If `output` is specified, writes the XSD content to file via `export_schema_to_file`,
/// handling I/O errors properly.
pub fn handle(
    output: Option<String>,
    version: &str,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    let schema_content = get_report_xml_schema(version)?;

    match output {
        None => Ok(CliOutput::Raw(schema_content.to_string())),
        Some(path) => {
            export_schema_to_file(schema_content, &path)?;
            if is_machine {
                let json = serde_json::json!({
                    "status": "success",
                    "exported_path": path,
                    "schema_version": version
                });
                Ok(CliOutput::Json(json.to_string()))
            } else {
                let msg = MSG_SCHEMA_EXPORT_SUCCESS
                    .replacen("{}", version, 1)
                    .replacen("{}", &path, 1);
                Ok(CliOutput::Success(msg))
            }
        }
    }
}
