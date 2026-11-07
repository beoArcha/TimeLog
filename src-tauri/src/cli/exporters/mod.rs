pub mod constants;
pub mod csv;
pub mod html;
pub mod json;
pub mod ods;
pub mod rows;
pub mod schema;
pub mod xlsx;
pub mod xml;

pub use self::constants::{
    MSG_EXPORT_SUCCESS, MSG_NO_REPORT_DATA, REPORT_COLUMN_HEADERS, REPORT_TOTAL_LABEL,
    REPORT_WORKSHEET_NAME,
};
pub use self::csv::export_csv;
pub use self::html::export_html;
pub use self::json::export_json;
pub use self::ods::export_ods;
pub use self::rows::{flatten_project, flatten_report, flatten_task, ReportRow};
pub use self::schema::{get_report_xml_schema, REPORT_XML_SCHEMA_V1};
pub use self::xlsx::export_xlsx;
pub use self::xml::export_xml;

use crate::cli::error::{CliError, SinkError};
use crate::cli::formatters::ReportTreeDto;
use crate::cli::parser::ExportFormat;
use std::path::Path;

pub(crate) fn sink_io_error(context: &str, error: impl std::fmt::Display) -> CliError {
    CliError::Sink(SinkError::Io(format!("{}: {}", context, error)))
}

pub fn export_to_file(
    tree: &ReportTreeDto,
    format: ExportFormat,
    output_path: &str,
) -> Result<(), CliError> {
    let bytes: Vec<u8> = match format {
        ExportFormat::Html => export_html(tree).into_bytes(),
        ExportFormat::Csv => export_csv(tree).into_bytes(),
        ExportFormat::Json => export_json(tree)?.into_bytes(),
        ExportFormat::Xml => export_xml(tree)?.into_bytes(),
        ExportFormat::Xlsx => export_xlsx(tree)?,
        ExportFormat::Ods => export_ods(tree)?,
    };

    if let Some(parent) = Path::new(output_path).parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).map_err(|e| {
                sink_io_error(
                    &format!("Failed to create parent directories for {}", output_path),
                    e,
                )
            })?;
        }
    }

    std::fs::write(output_path, &bytes).map_err(|e| {
        sink_io_error(
            &format!("Failed to write export file to {}", output_path),
            e,
        )
    })?;
    Ok(())
}
