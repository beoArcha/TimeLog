use crate::cli::error::CliError;
use crate::cli::exporters::constants::{
    ERR_ENVELOPE_SCHEMA_JSON_ONLY, MSG_SCHEMA_EXPORT_SUCCESS, XML_SCHEMA_NAME, XML_SCHEMA_VERSION,
};
use crate::cli::exporters::schema::{export_schema_to_file, get_report_xml_schema};
use crate::cli::exporters::{envelope_json_schema, report_json_schema};
use crate::cli::parser::{SchemaFormat, SchemaTarget};
use crate::cli::shared::output::CliOutput;
use crate::types::{
    ENVELOPE_SCHEMA_NAME, ENVELOPE_SCHEMA_VERSION, REPORT_SCHEMA_NAME, REPORT_SCHEMA_VERSION,
};

/// Handles the `oxy report schema` CLI command.
///
/// Without `output` the schema goes to stdout via `CliOutput::Raw`, so `--machine` needs no extra
/// wrapping and stdout stays a single schema document.
pub fn handle(
    output: Option<&str>,
    format: SchemaFormat,
    target: SchemaTarget,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    let (name, version, content) = resolve_schema(format, target)?;

    let Some(path) = output else {
        return Ok(CliOutput::Raw(content));
    };

    export_schema_to_file(&content, path)?;
    if is_machine {
        let json = serde_json::json!({
            "status": "success",
            "exported_path": path,
            "schema": name,
            "schema_version": version
        });
        return Ok(CliOutput::Json(json.to_string()));
    }
    let msg = MSG_SCHEMA_EXPORT_SUCCESS
        .replacen("{}", name, 1)
        .replacen("{}", &version.to_string(), 1)
        .replacen("{}", path, 1);
    Ok(CliOutput::Success(msg))
}

/// The XSD describes the legacy `report export -f xml` document, so it only exists for the
/// report target and is versioned independently of `oxy.report`.
fn resolve_schema(
    format: SchemaFormat,
    target: SchemaTarget,
) -> Result<(&'static str, u32, String), CliError> {
    match (format, target) {
        (SchemaFormat::Json, SchemaTarget::Report) => Ok((
            REPORT_SCHEMA_NAME,
            REPORT_SCHEMA_VERSION,
            report_json_schema()?,
        )),
        (SchemaFormat::Json, SchemaTarget::Envelope) => Ok((
            ENVELOPE_SCHEMA_NAME,
            ENVELOPE_SCHEMA_VERSION,
            envelope_json_schema()?,
        )),
        (SchemaFormat::Xml, SchemaTarget::Report) => Ok((
            XML_SCHEMA_NAME,
            XML_SCHEMA_VERSION,
            get_report_xml_schema(&XML_SCHEMA_VERSION.to_string())?.to_string(),
        )),
        (SchemaFormat::Xml, SchemaTarget::Envelope) => {
            Err(CliError::syntax_invalid_args(ERR_ENVELOPE_SCHEMA_JSON_ONLY))
        }
    }
}
