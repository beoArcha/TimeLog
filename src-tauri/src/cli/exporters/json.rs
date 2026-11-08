use super::sink_io_error;
use crate::cli::error::{CliError, SinkError};
use crate::cli::formatters::ReportTreeDto;
use std::io::Write;

pub fn write_json<W: Write>(tree: &ReportTreeDto, writer: W) -> Result<(), CliError> {
    serde_json::to_writer_pretty(writer, tree)
        .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))
}

pub fn export_json(tree: &ReportTreeDto) -> Result<String, CliError> {
    let mut buffer = Vec::new();
    write_json(tree, &mut buffer)?;
    String::from_utf8(buffer).map_err(|e| sink_io_error("Failed to decode UTF-8 JSON", e))
}
