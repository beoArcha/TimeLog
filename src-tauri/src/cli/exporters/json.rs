use crate::cli::error::{CliError, SinkError};
use crate::cli::formatters::ReportTreeDto;

pub fn export_json(tree: &ReportTreeDto) -> Result<String, CliError> {
    serde_json::to_string_pretty(tree)
        .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))
}
