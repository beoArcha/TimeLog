use super::constants::{REPORT_COLUMN_HEADERS, REPORT_TOTAL_LABEL, REPORT_WORKSHEET_NAME};
use super::rows::flatten_report;
use crate::cli::error::{CliError, SinkError};
use crate::cli::formatters::ReportTreeDto;
use spreadsheet_ods::{OdsError, Sheet, WorkBook};

pub fn map_ods_err(e: OdsError) -> CliError {
    CliError::Sink(SinkError::Serialization(e.to_string()))
}

fn build_ods_workbook(tree: &ReportTreeDto) -> Result<WorkBook, CliError> {
    let mut workbook = WorkBook::new_empty();
    let mut sheet = Sheet::new(REPORT_WORKSHEET_NAME);

    for (col, header) in REPORT_COLUMN_HEADERS.iter().enumerate() {
        sheet.set_value(0, col as u32, *header);
    }

    let mut current_row: u32 = 1;

    for row in flatten_report(tree)? {
        sheet.set_value(current_row, 0, row.project_name.as_str());
        sheet.set_value(current_row, 1, row.task_name.as_str());
        sheet.set_value(current_row, 2, row.subtask_name.as_deref().unwrap_or(""));
        sheet.set_value(current_row, 3, row.duration_seconds as f64);
        sheet.set_value(current_row, 4, row.duration_formatted.as_str());
        sheet.set_value(current_row, 5, row.percentage);
        current_row += 1;
    }

    let total_pct = if tree.total_seconds > 0 { 100.0 } else { 0.0 };
    sheet.set_value(current_row, 0, REPORT_TOTAL_LABEL);
    sheet.set_value(current_row, 1, "");
    sheet.set_value(current_row, 2, "");
    sheet.set_value(current_row, 3, tree.total_seconds as f64);
    sheet.set_value(current_row, 4, tree.total_formatted.as_str());
    sheet.set_value(current_row, 5, total_pct);

    workbook.push_sheet(sheet);
    Ok(workbook)
}

use super::sink_io_error;
use std::io::Write;

pub fn export_ods(tree: &ReportTreeDto) -> Result<Vec<u8>, CliError> {
    let mut workbook = build_ods_workbook(tree)?;
    spreadsheet_ods::write_ods_buf(&mut workbook, Vec::new()).map_err(map_ods_err)
}

pub fn write_ods<W: Write>(tree: &ReportTreeDto, mut writer: W) -> Result<(), CliError> {
    let bytes = export_ods(tree)?;
    writer
        .write_all(&bytes)
        .map_err(|e| sink_io_error("Failed to write ODS workbook", e))?;
    Ok(())
}
