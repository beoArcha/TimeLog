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
    ERR_UNSUPPORTED_SCHEMA_VERSION, MSG_EXPORT_SUCCESS, MSG_NO_REPORT_DATA,
    MSG_SCHEMA_EXPORT_SUCCESS, REPORT_COLUMN_HEADERS, REPORT_TOTAL_LABEL, REPORT_WORKSHEET_NAME,
};
pub use self::csv::{export_csv, sanitize_csv, sanitize_csv_formula, write_csv};
pub use self::html::{escape_html, export_html, write_html};
pub use self::json::{export_json, write_json};
pub use self::ods::{export_ods, write_ods};
pub use self::rows::{flatten_project, flatten_report, flatten_task, ReportRow, RowsError};
pub use self::schema::{export_schema_to_file, get_report_xml_schema, REPORT_XML_SCHEMA_V1};
pub use self::xlsx::{export_xlsx, write_xlsx};
pub use self::xml::{export_xml, validate_report_xml_structure, write_xml, XmlValidationError};

use crate::cli::error::{CliError, SinkError};
use crate::cli::formatters::ReportTreeDto;
use crate::cli::parser::ExportFormat;
use std::io::{BufWriter, Write};
use std::path::Path;

pub(crate) fn sink_io_error(context: &str, error: impl std::fmt::Display) -> CliError {
    CliError::Sink(SinkError::Io(format!("{}: {}", context, error)))
}

/// Dispatches streaming export to any destination implementing `std::io::Write`.
pub fn export_to_writer<W: Write>(
    tree: &ReportTreeDto,
    format: ExportFormat,
    writer: W,
) -> Result<(), CliError> {
    match format {
        ExportFormat::Html => write_html(tree, writer),
        ExportFormat::Csv => write_csv(tree, writer),
        ExportFormat::Json => write_json(tree, writer),
        ExportFormat::Xml => write_xml(tree, writer),
        ExportFormat::Xlsx => write_xlsx(tree, writer),
        ExportFormat::Ods => write_ods(tree, writer),
    }
}

/// Performs an atomic, buffered write to a target file path.
///
/// Writes to a temporary `.tmp` file in the same directory using `std::io::BufWriter`
/// and atomically renames it to `output_path` upon successful completion.
/// If an error occurs during writing or flushing, the temporary file is deleted,
/// ensuring no corrupted or partial files are left behind.
pub fn atomic_write_to_file<F>(output_path: &str, write_fn: F) -> Result<(), CliError>
where
    F: FnOnce(&mut BufWriter<std::fs::File>) -> Result<(), CliError>,
{
    let target_path = Path::new(output_path);

    if let Some(parent) = target_path.parent().filter(|p| !p.as_os_str().is_empty()) {
        std::fs::create_dir_all(parent).map_err(|e| {
            sink_io_error(
                &format!("Failed to create parent directories for {}", output_path),
                e,
            )
        })?;
    }

    if target_path.is_dir() {
        return Err(sink_io_error(
            &format!("Failed to write export file to {}", output_path),
            std::io::Error::new(
                std::io::ErrorKind::AlreadyExists,
                "Target path is an existing directory",
            ),
        ));
    }

    let parent = target_path
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."));

    let file_name = target_path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("export");

    let unique_id = uuid::Uuid::new_v4();
    let temp_file_name = format!(".{}.{}.tmp", file_name, unique_id);
    let temp_path = parent.join(temp_file_name);

    let file = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&temp_path)
        .map_err(|e| {
            sink_io_error(
                &format!("Failed to write export file to {}", output_path),
                e,
            )
        })?;

    let mut buf_writer = BufWriter::new(file);

    let write_res = write_fn(&mut buf_writer);
    if let Err(err) = write_res {
        drop(buf_writer);
        let _ = std::fs::remove_file(&temp_path);
        return Err(err);
    }

    if let Err(err) = buf_writer.flush() {
        drop(buf_writer);
        let _ = std::fs::remove_file(&temp_path);
        return Err(sink_io_error(
            &format!("Failed to write export file to {}", output_path),
            err,
        ));
    }

    drop(buf_writer);

    std::fs::rename(&temp_path, target_path).map_err(|e| {
        let _ = std::fs::remove_file(&temp_path);
        sink_io_error(
            &format!("Failed to write export file to {}", output_path),
            e,
        )
    })?;

    Ok(())
}

/// Exports a report tree to the given file format and path using atomic writes with `BufWriter`.
pub fn export_to_file(
    tree: &ReportTreeDto,
    format: ExportFormat,
    output_path: &str,
) -> Result<(), CliError> {
    atomic_write_to_file(output_path, |writer| export_to_writer(tree, format, writer))
}
