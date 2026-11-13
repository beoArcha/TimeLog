use super::sink_io_error;
use crate::cli::error::{CliError, SinkError};
use crate::types::ReportDocument;
use std::io::Write;

/// The bare `ReportDocument`, pretty-printed; the trailing newline keeps a piped file POSIX-clean.
pub fn write_json<W: Write>(document: &ReportDocument, mut writer: W) -> Result<(), CliError> {
    serde_json::to_writer_pretty(&mut writer, document)
        .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
    writer
        .write_all(b"\n")
        .map_err(|e| sink_io_error("Failed to write JSON report", e))
}

pub fn export_json(document: &ReportDocument) -> Result<String, CliError> {
    let mut buffer = Vec::new();
    write_json(document, &mut buffer)?;
    String::from_utf8(buffer).map_err(|e| sink_io_error("Failed to decode UTF-8 JSON", e))
}
