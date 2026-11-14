use super::constants::JSONL_WRITE_FAILED;
use super::sink_io_error;
use crate::cli::error::{CliError, SinkError};
use crate::types::{
    ReportDocument, ReportEntry, ReportFilters, ReportGenerator, ReportTotals, ReportVariant,
    ResolvedRange,
};
use serde::Serialize;
use std::io::Write;

/// The document's top-level fields, minus the `projects`, `days` and `entries` sections that
/// the header line replaces. Keys come from the same serde rules as `ReportDocument`.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ReportHeader<'a> {
    schema: &'a str,
    schema_version: u32,
    variant: ReportVariant,
    generated_at: &'a str,
    generator: &'a ReportGenerator,
    range: &'a ResolvedRange,
    filters: &'a ReportFilters,
    totals: &'a ReportTotals,
}

/// One JSON Lines record. The `type` tag tells a streaming consumer what each line carries.
#[derive(Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
enum JsonlLine<'a> {
    Header(ReportHeader<'a>),
    Entry(&'a ReportEntry),
}

/// Writes a header line followed by one line per entry, in document order. A summary document
/// has no entries, so it yields the header alone.
pub fn write_jsonl<W: Write>(document: &ReportDocument, mut writer: W) -> Result<(), CliError> {
    write_line(&mut writer, &JsonlLine::Header(header_of(document)))?;
    for entry in document.entries.iter().flatten() {
        write_line(&mut writer, &JsonlLine::Entry(entry))?;
    }
    Ok(())
}

fn header_of(document: &ReportDocument) -> ReportHeader<'_> {
    ReportHeader {
        schema: &document.schema,
        schema_version: document.schema_version,
        variant: document.variant,
        generated_at: &document.generated_at,
        generator: &document.generator,
        range: &document.range,
        filters: &document.filters,
        totals: &document.totals,
    }
}

// Each line is serialized in full before it is written, so a serialization failure never leaves
// a truncated record on the sink.
fn write_line<W: Write>(writer: &mut W, line: &JsonlLine<'_>) -> Result<(), CliError> {
    let mut bytes = serde_json::to_vec(line)
        .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
    bytes.push(b'\n');
    writer
        .write_all(&bytes)
        .map_err(|e| sink_io_error(JSONL_WRITE_FAILED, e))
}
