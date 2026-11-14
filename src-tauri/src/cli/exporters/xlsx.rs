use super::constants::{
    ERR_XLSX_WRITE, XLSX_CHART_TITLE_DAILY_TIME, XLSX_CHART_TITLE_PROJECT_SHARES, XLSX_FORMAT_DATE,
    XLSX_FORMAT_DATE_TIME, XLSX_FORMAT_DURATION, XLSX_FORMAT_MONEY, XLSX_FORMAT_SHARE,
};
use super::sheets::{
    build_workbook_model, CellValue, RowKind, SheetModel, WorkbookModel, DAYS_DATE_COLUMN,
    DAYS_TIME_COLUMN, SUMMARY_SHARE_COLUMN,
};
use super::sink_io_error;
use crate::cli::error::{CliError, SinkError};
use crate::types::ReportDocument;
use rust_xlsxwriter::{
    Chart, ChartDataLabel, ChartType, Color, ExcelDateTime, Format, Table, TableColumn, Workbook,
    Worksheet, XlsxError,
};
use std::io::Write;

const SECONDS_PER_DAY: f64 = 86_400.0;
const MINOR_UNITS_PER_MAJOR: f64 = 100.0;
const BASIS_POINTS_PER_UNIT: f64 = 10_000.0;
const HEADER_FILL: u32 = 0x00E2_E8F0;

pub fn map_xlsx_err(e: XlsxError) -> CliError {
    CliError::Sink(SinkError::Serialization(e.to_string()))
}

pub fn export_xlsx(document: &ReportDocument) -> Result<Vec<u8>, CliError> {
    build_workbook(&build_workbook_model(document)).map_err(map_xlsx_err)
}

pub fn write_xlsx<W: Write>(document: &ReportDocument, mut writer: W) -> Result<(), CliError> {
    let bytes = export_xlsx(document)?;
    writer
        .write_all(&bytes)
        .map_err(|e| sink_io_error(ERR_XLSX_WRITE, e))
}

fn build_workbook(model: &WorkbookModel) -> Result<Vec<u8>, XlsxError> {
    let mut workbook = Workbook::new();
    write_summary_sheet(workbook.add_worksheet(), &model.summary)?;
    if let Some(entries) = &model.entries {
        write_entries_sheet(workbook.add_worksheet(), entries)?;
    }
    if let Some(days) = &model.days {
        write_days_sheet(workbook.add_worksheet(), days)?;
    }
    workbook.save_to_buffer()
}

fn write_summary_sheet(sheet: &mut Worksheet, model: &SheetModel) -> Result<(), XlsxError> {
    sheet.set_name(model.name)?;
    write_headers(sheet, model)?;
    write_rows(sheet, model)?;
    finish_sheet(sheet)?;
    if let Some(chart) = project_share_chart(model) {
        sheet.insert_chart(1, column_after(model), &chart)?;
    }
    Ok(())
}

/// A table with zero data rows is invalid, so an empty entry list keeps a plain filtered header.
fn write_entries_sheet(sheet: &mut Worksheet, model: &SheetModel) -> Result<(), XlsxError> {
    sheet.set_name(model.name)?;
    write_rows(sheet, model)?;
    let last_column = last_column(model);
    match u32::try_from(model.rows.len()) {
        Ok(last_row) if last_row > 0 => {
            let columns: Vec<TableColumn> = model
                .headers
                .iter()
                .map(|header| TableColumn::new().set_header(header.clone()))
                .collect();
            let table = Table::new().set_columns(&columns);
            sheet.add_table(0, 0, last_row, last_column, &table)?;
        }
        _ => {
            write_headers(sheet, model)?;
            sheet.autofilter(0, 0, 0, last_column)?;
        }
    }
    finish_sheet(sheet)
}

fn write_days_sheet(sheet: &mut Worksheet, model: &SheetModel) -> Result<(), XlsxError> {
    sheet.set_name(model.name)?;
    write_headers(sheet, model)?;
    write_rows(sheet, model)?;
    finish_sheet(sheet)?;
    if let Some(chart) = daily_time_chart(model) {
        sheet.insert_chart(1, column_after(model), &chart)?;
    }
    Ok(())
}

fn finish_sheet(sheet: &mut Worksheet) -> Result<(), XlsxError> {
    sheet.set_freeze_panes(1, 0)?;
    sheet.autofit();
    Ok(())
}

fn last_column(model: &SheetModel) -> u16 {
    u16::try_from(model.headers.len().saturating_sub(1)).unwrap_or(u16::MAX)
}

fn column_after(model: &SheetModel) -> u16 {
    last_column(model).saturating_add(2)
}

fn sheet_row(index: usize) -> u32 {
    u32::try_from(index + 1).unwrap_or(u32::MAX)
}

fn write_headers(sheet: &mut Worksheet, model: &SheetModel) -> Result<(), XlsxError> {
    let format = Format::new()
        .set_bold()
        .set_background_color(Color::RGB(HEADER_FILL));
    for (column, header) in (0u16..).zip(&model.headers) {
        sheet.write_string_with_format(0, column, header, &format)?;
    }
    Ok(())
}

fn write_rows(sheet: &mut Worksheet, model: &SheetModel) -> Result<(), XlsxError> {
    for (row, sheet_row) in (1u32..).zip(&model.rows) {
        let bold = sheet_row.kind == RowKind::Total;
        for (column, value) in (0u16..).zip(&sheet_row.cells) {
            write_cell(sheet, row, column, value, bold)?;
        }
    }
    Ok(())
}

fn write_cell(
    sheet: &mut Worksheet,
    row: u32,
    column: u16,
    value: &CellValue,
    bold: bool,
) -> Result<(), XlsxError> {
    let format = cell_format(value, bold);
    match value {
        CellValue::Empty => Ok(()),
        CellValue::Text(text) => sheet
            .write_string_with_format(row, column, text, &format)
            .map(drop),
        CellValue::Duration { seconds } => sheet
            .write_number_with_format(row, column, *seconds as f64 / SECONDS_PER_DAY, &format)
            .map(drop),
        CellValue::Share { basis_points } => sheet
            .write_number_with_format(
                row,
                column,
                f64::from(*basis_points) / BASIS_POINTS_PER_UNIT,
                &format,
            )
            .map(drop),
        CellValue::Money { amount_minor, .. } => sheet
            .write_number_with_format(
                row,
                column,
                *amount_minor as f64 / MINOR_UNITS_PER_MAJOR,
                &format,
            )
            .map(drop),
        CellValue::Date(date) | CellValue::DateTime(date) => {
            let instant = ExcelDateTime::parse_from_str(date)?;
            sheet
                .write_datetime_with_format(row, column, &instant, &format)
                .map(drop)
        }
    }
}

fn cell_format(value: &CellValue, bold: bool) -> Format {
    let format = if bold {
        Format::new().set_bold()
    } else {
        Format::new()
    };
    match value {
        CellValue::Duration { .. } => format.set_num_format(XLSX_FORMAT_DURATION),
        CellValue::Share { .. } => format.set_num_format(XLSX_FORMAT_SHARE),
        CellValue::Date(_) => format.set_num_format(XLSX_FORMAT_DATE),
        CellValue::DateTime(_) => format.set_num_format(XLSX_FORMAT_DATE_TIME),
        CellValue::Money { currency, .. } => format.set_num_format(money_format(currency)),
        CellValue::Empty | CellValue::Text(_) => format,
    }
}

/// Quotes inside the currency code would end the literal early and corrupt the number format.
fn money_format(currency: &str) -> String {
    XLSX_FORMAT_MONEY.replacen("{}", &currency.replace('"', ""), 1)
}

fn project_share_chart(model: &SheetModel) -> Option<Chart> {
    let (first, last) = model.row_span(RowKind::Project)?;
    let (first, last) = (sheet_row(first), sheet_row(last));
    let mut chart = Chart::new(ChartType::Pie);
    chart
        .add_series()
        .set_categories((model.name, first, 0u16, last, 0u16))
        .set_values((
            model.name,
            first,
            SUMMARY_SHARE_COLUMN,
            last,
            SUMMARY_SHARE_COLUMN,
        ))
        .set_data_label(ChartDataLabel::new().show_percentage());
    chart.title().set_name(XLSX_CHART_TITLE_PROJECT_SHARES);
    Some(chart)
}

fn daily_time_chart(model: &SheetModel) -> Option<Chart> {
    let (first, last) = model.row_span(RowKind::Day)?;
    let (first, last) = (sheet_row(first), sheet_row(last));
    let mut chart = Chart::new(ChartType::Column);
    chart
        .add_series()
        .set_categories((model.name, first, DAYS_DATE_COLUMN, last, DAYS_DATE_COLUMN))
        .set_values((model.name, first, DAYS_TIME_COLUMN, last, DAYS_TIME_COLUMN));
    chart.title().set_name(XLSX_CHART_TITLE_DAILY_TIME);
    chart.y_axis().set_num_format(XLSX_FORMAT_DURATION);
    chart.legend().set_hidden();
    Some(chart)
}
