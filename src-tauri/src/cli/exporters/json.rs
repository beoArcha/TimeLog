use crate::cli::formatters::ReportTreeDto;

pub fn export_json(tree: &ReportTreeDto) -> String {
    serde_json::to_string_pretty(tree).unwrap_or_else(|_| "{}".to_string())
}
