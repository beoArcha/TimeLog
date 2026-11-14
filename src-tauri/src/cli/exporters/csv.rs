//! CSV writer: one flat table per report variant; cell safety lives in `csv_sanitize`.

use super::constants::{
    CSV_FULL_HEADERS, CSV_SUMMARY_HEADERS, ERR_CSV_WRITE_BOM, ERR_CSV_WRITE_ROW,
};
use super::csv_records::{full_records, summary_records, Record};
use super::options::{CsvDelimiter, CsvOptions};
use super::sink_io_error;
use crate::cli::error::CliError;
use crate::types::{ReportDocument, ReportVariant};
use std::borrow::Cow;
use std::io::Write;

const UTF8_BOM: [u8; 3] = [0xEF, 0xBB, 0xBF];
const RECORD_TERMINATOR: char = '\n';

/// Quotes a cell only when the delimiter, a quote or a line break would otherwise corrupt the row.
pub fn escape_csv_field(value: &str, delimiter: CsvDelimiter) -> Cow<'_, str> {
    if !value.contains([delimiter.as_char(), '"', '\n', '\r']) {
        return Cow::Borrowed(value);
    }
    Cow::Owned(format!("\"{}\"", value.replace('"', "\"\"")))
}

/// One flat table: the `summary` variant lists tasks, the `full` variant lists entries.
pub fn write_csv<W: Write>(
    document: &ReportDocument,
    options: CsvOptions,
    mut writer: W,
) -> Result<(), CliError> {
    if options.bom {
        writer
            .write_all(&UTF8_BOM)
            .map_err(|e| sink_io_error(ERR_CSV_WRITE_BOM, e))?;
    }
    let (headers, records) = match document.variant {
        ReportVariant::Summary => (header(&CSV_SUMMARY_HEADERS), summary_records(document)),
        ReportVariant::Full => (header(&CSV_FULL_HEADERS), full_records(document)),
    };
    write_record(&mut writer, &headers, options.delimiter)?;
    for record in &records {
        write_record(&mut writer, record, options.delimiter)?;
    }
    Ok(())
}

fn header(columns: &[&str]) -> Record {
    columns.iter().map(|column| column.to_string()).collect()
}

fn write_record<W: Write>(
    writer: &mut W,
    record: &[String],
    delimiter: CsvDelimiter,
) -> Result<(), CliError> {
    let separator = delimiter.as_char().to_string();
    let mut line = record
        .iter()
        .map(|cell| escape_csv_field(cell, delimiter))
        .collect::<Vec<_>>()
        .join(&separator);
    line.push(RECORD_TERMINATOR);
    writer
        .write_all(line.as_bytes())
        .map_err(|e| sink_io_error(ERR_CSV_WRITE_ROW, e))
}
