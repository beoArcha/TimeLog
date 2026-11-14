use super::exporter_sheets_test::a_two_currency_document;
use crate::shared::report_document_builders::a_document;
use crate::shared::spreadsheet_helpers::{
    count_xlsx_rows, get_xlsx_cell_f64, get_xlsx_cell_str, read_xlsx_part,
};
use calamine::{Data, Reader, Xlsx};
use oxyflow_timelog::cli::error::{CliError, SinkError};
use oxyflow_timelog::cli::exporters::xlsx::{export_xlsx, map_xlsx_err};
use oxyflow_timelog::types::ReportVariant;
use rust_xlsxwriter::XlsxError;
use std::io::Cursor;

fn open(bytes: &[u8]) -> Xlsx<Cursor<&[u8]>> {
    Xlsx::new(Cursor::new(bytes)).expect("must parse as xlsx")
}

#[test]
fn test_given_xlsx_error_when_mapping_then_returns_sink_serialization_error() {
    // Arrange
    let err = XlsxError::SheetnameLengthExceeded(
        "NameThatIsWayTooLongForAnExcelWorksheetNameMoreThan31Chars".to_string(),
    );

    // Act
    let cli_err = map_xlsx_err(err);

    // Assert
    match cli_err {
        CliError::Sink(SinkError::Serialization(msg)) => {
            assert!(msg.contains("NameThatIsWayTooLong"));
        }
        other => panic!(
            "expected CliError::Sink(SinkError::Serialization), got {:?}",
            other
        ),
    }
}

#[test]
fn test_given_full_document_when_export_xlsx_then_workbook_has_the_three_sheets_in_order() {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Full);

    // Act
    let bytes = export_xlsx(&document).expect("xlsx export should succeed");

    // Assert
    assert_eq!(open(&bytes).sheet_names(), ["Summary", "Entries", "Days"]);
}

#[test]
fn test_given_full_document_when_export_xlsx_then_each_sheet_has_a_row_per_record_plus_header() {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Full);

    // Act
    let bytes = export_xlsx(&document).expect("xlsx export should succeed");

    // Assert
    assert_eq!(count_xlsx_rows(&bytes, 1), 1 + 2 + 3 + 1);
    assert_eq!(count_xlsx_rows(&bytes, 2), 1 + 2);
    assert_eq!(count_xlsx_rows(&bytes, 3), 1 + 2);
}

#[test]
fn test_given_full_document_when_export_xlsx_then_pie_and_bar_charts_and_entries_table_exist() {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Full);

    // Act
    let bytes = export_xlsx(&document).expect("xlsx export should succeed");

    // Assert
    let pie = read_xlsx_part(&bytes, "xl/charts/chart1.xml").expect("chart1.xml");
    let bar = read_xlsx_part(&bytes, "xl/charts/chart2.xml").expect("chart2.xml");
    assert!(pie.contains("<c:pieChart>"));
    assert!(pie.contains("Summary!$D$2:$D$3"));
    assert!(bar.contains("<c:barChart>"));
    assert!(bar.contains("Days!$B$2:$B$3"));
    let table = read_xlsx_part(&bytes, "xl/tables/table1.xml").expect("table1.xml");
    assert!(table.contains("<autoFilter"));
}

#[test]
fn test_given_summary_document_when_export_xlsx_then_only_summary_sheet_with_pie_chart_exists() {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Summary);

    // Act
    let bytes = export_xlsx(&document).expect("xlsx export should succeed");

    // Assert
    assert_eq!(open(&bytes).sheet_names(), ["Summary"]);
    assert!(read_xlsx_part(&bytes, "xl/charts/chart1.xml").is_some());
    assert!(read_xlsx_part(&bytes, "xl/charts/chart2.xml").is_none());
    assert!(read_xlsx_part(&bytes, "xl/tables/table1.xml").is_none());
}

#[test]
fn test_given_durations_and_money_when_export_xlsx_then_cells_are_numeric_with_number_formats() {
    // Arrange
    let document = a_two_currency_document(ReportVariant::Summary);

    // Act
    let bytes = export_xlsx(&document).expect("xlsx export should succeed");

    // Assert
    let mut workbook = open(&bytes);
    let range = workbook.worksheet_range("Summary").expect("Summary sheet");
    assert_eq!(get_xlsx_cell_str(&range, 1, 0), "Alpha");
    let time = range.get((1, 2)).expect("time cell");
    assert!(
        matches!(time, Data::DateTime(dt) if dt.is_duration()
            && (dt.as_f64() - 5400.0 / 86_400.0).abs() < 1e-9),
        "expected a duration cell of 1.5 hours, got {time:?}"
    );
    assert!((get_xlsx_cell_f64(&range, 1, 3) - 0.6).abs() < 1e-9);
    assert!((get_xlsx_cell_f64(&range, 1, 5) - 150.0).abs() < 1e-9);
    let styles = read_xlsx_part(&bytes, "xl/styles.xml").expect("styles.xml");
    assert!(styles.contains("[h]:mm"));
    assert!(styles.contains("#,##0.00 &quot;PLN&quot;"));
    assert!(styles.contains("#,##0.00 &quot;EUR&quot;"));
}

#[test]
fn test_given_empty_full_report_when_export_xlsx_then_entries_sheet_keeps_a_filtered_header() {
    // Arrange
    let mut document = a_document(ReportVariant::Full);
    document.totals.seconds = 0;
    document.totals.billing = vec![];
    document.projects = vec![];
    document.days = vec![];
    document.entries = Some(vec![]);

    // Act
    let bytes = export_xlsx(&document).expect("xlsx export should succeed");

    // Assert
    let mut workbook = open(&bytes);
    let entries = workbook.worksheet_range("Entries").expect("Entries sheet");
    assert_eq!(get_xlsx_cell_str(&entries, 0, 0), "Date");
    assert_eq!(count_xlsx_rows(&bytes, 2), 1);
    assert!(read_xlsx_part(&bytes, "xl/worksheets/sheet2.xml")
        .expect("sheet2.xml")
        .contains("<autoFilter"));
    assert!(read_xlsx_part(&bytes, "xl/charts/chart1.xml").is_none());
}

#[test]
fn test_given_special_characters_and_formula_like_note_when_export_xlsx_then_cells_stay_text() {
    // Arrange
    let mut document = a_two_currency_document(ReportVariant::Full);
    document.projects[0].name = "Projekt \"Zażółć\" <gęślą> & jaźń".to_string();
    let entries = document.entries.as_mut().expect("entries");
    entries[0].note = Some("=SUM(1,2)".to_string());

    // Act
    let bytes = export_xlsx(&document).expect("xlsx export should succeed");

    // Assert
    let mut workbook = open(&bytes);
    let summary = workbook.worksheet_range("Summary").expect("Summary sheet");
    assert_eq!(
        get_xlsx_cell_str(&summary, 1, 0),
        "Projekt \"Zażółć\" <gęślą> & jaźń"
    );
    let sheet = read_xlsx_part(&bytes, "xl/worksheets/sheet2.xml").expect("sheet2.xml");
    assert!(!sheet.contains("<f>"));
    let entries = workbook.worksheet_range("Entries").expect("Entries sheet");
    assert_eq!(get_xlsx_cell_str(&entries, 1, 5), "=SUM(1,2)");
}
