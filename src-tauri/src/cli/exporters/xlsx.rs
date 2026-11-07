use super::constants::{REPORT_COLUMN_HEADERS, REPORT_TOTAL_LABEL, REPORT_WORKSHEET_NAME};
use super::rows::flatten_report;
use crate::cli::error::{CliError, SinkError};
use crate::cli::formatters::ReportTreeDto;
use rust_xlsxwriter::{Color, Format, Workbook, XlsxError};

pub fn map_xlsx_err(e: XlsxError) -> CliError {
    CliError::Sink(SinkError::Serialization(e.to_string()))
}

pub fn export_xlsx(tree: &ReportTreeDto) -> Result<Vec<u8>, CliError> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();
    worksheet
        .set_name(REPORT_WORKSHEET_NAME)
        .map_err(map_xlsx_err)?;

    let header_format = Format::new()
        .set_bold()
        .set_background_color(Color::RGB(0x00E2E8F0));

    for (col, header) in REPORT_COLUMN_HEADERS.iter().enumerate() {
        worksheet
            .write_with_format(0, col as u16, *header, &header_format)
            .map_err(map_xlsx_err)?;
    }

    let mut current_row: u32 = 1;

    for row in flatten_report(tree)? {
        worksheet
            .write(current_row, 0, row.project_name.as_str())
            .map_err(map_xlsx_err)?;
        worksheet
            .write(current_row, 1, row.task_name.as_str())
            .map_err(map_xlsx_err)?;
        worksheet
            .write(current_row, 2, row.subtask_name.as_deref().unwrap_or(""))
            .map_err(map_xlsx_err)?;
        worksheet
            .write(current_row, 3, row.duration_seconds)
            .map_err(map_xlsx_err)?;
        worksheet
            .write(current_row, 4, row.duration_formatted.as_str())
            .map_err(map_xlsx_err)?;
        worksheet
            .write(current_row, 5, row.percentage)
            .map_err(map_xlsx_err)?;
        current_row += 1;
    }

    let total_format = Format::new().set_bold();
    let total_pct = if tree.total_seconds > 0 { 100.0 } else { 0.0 };
    worksheet
        .write_with_format(current_row, 0, REPORT_TOTAL_LABEL, &total_format)
        .map_err(map_xlsx_err)?;
    worksheet
        .write_with_format(current_row, 1, "", &total_format)
        .map_err(map_xlsx_err)?;
    worksheet
        .write_with_format(current_row, 2, "", &total_format)
        .map_err(map_xlsx_err)?;
    worksheet
        .write_with_format(current_row, 3, tree.total_seconds, &total_format)
        .map_err(map_xlsx_err)?;
    worksheet
        .write_with_format(current_row, 4, tree.total_formatted.as_str(), &total_format)
        .map_err(map_xlsx_err)?;
    worksheet
        .write_with_format(current_row, 5, total_pct, &total_format)
        .map_err(map_xlsx_err)?;

    worksheet.set_column_width(0, 24).map_err(map_xlsx_err)?;
    worksheet.set_column_width(1, 32).map_err(map_xlsx_err)?;
    worksheet.set_column_width(2, 24).map_err(map_xlsx_err)?;
    worksheet.set_column_width(3, 18).map_err(map_xlsx_err)?;
    worksheet.set_column_width(4, 18).map_err(map_xlsx_err)?;
    worksheet.set_column_width(5, 14).map_err(map_xlsx_err)?;

    workbook.save_to_buffer().map_err(map_xlsx_err)
}
