use crate::cli::error::{CliError, SinkError};
use crate::cli::formatters::ReportTreeDto;

pub fn export_xml(tree: &ReportTreeDto) -> Result<String, CliError> {
    let mut xml = String::from("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    let content = quick_xml::se::to_string(tree).map_err(|e| {
        log::error!("Failed to serialize report to XML: {e}");
        CliError::Sink(SinkError::Serialization(e.to_string()))
    })?;
    xml.push_str(&content);
    Ok(xml)
}
