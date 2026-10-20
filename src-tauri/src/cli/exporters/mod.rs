pub mod constants;
pub mod csv;
pub mod html;
pub mod json;

pub use self::constants::{MSG_EXPORT_SUCCESS, MSG_NO_REPORT_DATA};
pub use self::csv::export_csv;
pub use self::html::export_html;
pub use self::json::export_json;

use self::constants::ERR_UNSUPPORTED_FORMAT;
use crate::cli::error::CliError;
use crate::cli::formatters::ReportTreeDto;
use crate::cli::parser::ExportFormat;
use std::path::Path;

pub fn export_to_file(
    tree: &ReportTreeDto,
    format: ExportFormat,
    output_path: &str,
) -> Result<(), CliError> {
    let content = match format {
        ExportFormat::Html => export_html(tree),
        ExportFormat::Csv => export_csv(tree),
        ExportFormat::Json => export_json(tree),
        ExportFormat::Xml | ExportFormat::Ods | ExportFormat::Xlsx => {
            let err_msg = ERR_UNSUPPORTED_FORMAT.replacen("{}", &format!("{:?}", format), 1);
            return Err(CliError::Syntax(err_msg));
        }
    };

    if let Some(parent) = Path::new(output_path).parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).map_err(|e| CliError::Storage(e.to_string()))?;
        }
    }

    std::fs::write(output_path, content).map_err(|e| CliError::Storage(e.to_string()))?;
    Ok(())
}
