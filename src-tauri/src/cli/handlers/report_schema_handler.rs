use crate::cli::error::CliError;
use crate::cli::exporters::constants::{ERR_XML_SCHEMA_UNAVAILABLE, MSG_SCHEMA_EXPORT_SUCCESS};
use crate::cli::exporters::schema::export_schema_to_file;
use crate::cli::exporters::{envelope_json_schema, report_json_schema};
use crate::cli::parser::{SchemaFormat, SchemaTarget};
use crate::cli::shared::output::CliOutput;
use crate::types::{
    ENVELOPE_SCHEMA_NAME, ENVELOPE_SCHEMA_VERSION, REPORT_SCHEMA_NAME, REPORT_SCHEMA_VERSION,
};

/// Handles the `oxy report schema` CLI command.
///
/// Without `output` the schema goes to stdout via `CliOutput::Raw`, which is already a JSON
/// document, so `--machine` needs no extra wrapping and stdout stays pure.
pub fn handle(
    output: Option<&str>,
    format: SchemaFormat,
    target: SchemaTarget,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    if format == SchemaFormat::Xml {
        return Err(CliError::syntax_invalid_args(ERR_XML_SCHEMA_UNAVAILABLE));
    }

    let (name, version, content) = match target {
        SchemaTarget::Report => (
            REPORT_SCHEMA_NAME,
            REPORT_SCHEMA_VERSION,
            report_json_schema()?,
        ),
        SchemaTarget::Envelope => (
            ENVELOPE_SCHEMA_NAME,
            ENVELOPE_SCHEMA_VERSION,
            envelope_json_schema()?,
        ),
    };

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
