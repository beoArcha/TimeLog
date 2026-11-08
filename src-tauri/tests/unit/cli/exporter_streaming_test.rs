use super::exporter_fixtures::create_sample_tree;
use crate::shared::spreadsheet_helpers::{get_ods_cell_str, get_xlsx_cell_str};
use calamine::{Reader, Xlsx};
use oxyflow_timelog::cli::error::{CliError, SinkError};
use oxyflow_timelog::cli::exporters::{
    atomic_write_to_file, export_csv, export_html, export_json, export_to_file, export_to_writer,
    write_csv, write_html, write_json, write_ods, write_xlsx, write_xml,
};
use oxyflow_timelog::cli::parser::ExportFormat;
use spreadsheet_ods::read_ods_buf;
use std::fs;
use std::io::{Cursor, Write};
use tempfile::tempdir;

#[test]
fn test_given_sample_tree_when_export_to_writer_called_for_all_formats_then_all_stream_successfully(
) {
    let tree = create_sample_tree();
    let formats = [
        ExportFormat::Html,
        ExportFormat::Csv,
        ExportFormat::Json,
        ExportFormat::Xml,
        ExportFormat::Xlsx,
        ExportFormat::Ods,
    ];

    for format in formats {
        let mut buffer = Vec::new();
        let res = export_to_writer(&tree, format, &mut buffer);
        assert!(
            res.is_ok(),
            "format {:?} streaming failed: {:?}",
            format,
            res
        );
        assert!(!buffer.is_empty(), "format {:?} streamed 0 bytes", format);
    }
}

#[test]
fn test_given_specific_writers_when_streaming_then_matches_export_output_parity() {
    let tree = create_sample_tree();

    // CSV parity
    let mut csv_buf = Vec::new();
    write_csv(&tree, &mut csv_buf).expect("write_csv");
    let csv_str = String::from_utf8(csv_buf).expect("utf8 csv");
    assert_eq!(csv_str, export_csv(&tree).expect("export_csv"));

    // JSON parity
    let mut json_buf = Vec::new();
    write_json(&tree, &mut json_buf).expect("write_json");
    let json_str = String::from_utf8(json_buf).expect("utf8 json");
    assert_eq!(json_str, export_json(&tree).expect("export_json"));

    // HTML parity
    let mut html_buf = Vec::new();
    write_html(&tree, &mut html_buf).expect("write_html");
    let html_str = String::from_utf8(html_buf).expect("utf8 html");
    assert_eq!(html_str, export_html(&tree).expect("export_html"));

    // XML parity
    let mut xml_buf = Vec::new();
    write_xml(&tree, &mut xml_buf).expect("write_xml");
    let xml_str = String::from_utf8(xml_buf).expect("utf8 xml");
    assert!(xml_str.starts_with("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
    assert!(xml_str.contains("<report schemaVersion=\"1\">"));

    // XLSX workbook valid parse and structure parity
    let mut xlsx_buf = Vec::new();
    write_xlsx(&tree, &mut xlsx_buf).expect("write_xlsx");
    let mut excel: Xlsx<_> = Xlsx::new(Cursor::new(&xlsx_buf)).expect("must parse xlsx");
    let range = excel
        .worksheet_range("Work Report")
        .expect("must contain Work Report worksheet");
    assert_eq!(get_xlsx_cell_str(&range, 0, 0), "Project");
    assert_eq!(get_xlsx_cell_str(&range, 1, 1), "Database Setup");

    // ODS workbook valid parse and structure parity
    let mut ods_buf = Vec::new();
    write_ods(&tree, &mut ods_buf).expect("write_ods");
    let ods = read_ods_buf(&ods_buf).expect("must parse ods");
    let sheet = ods.sheet(0);
    assert_eq!(sheet.name(), "Work Report");
    assert_eq!(get_ods_cell_str(sheet, 0, 0), "Project");
    assert_eq!(get_ods_cell_str(sheet, 1, 1), "Database Setup");
}

#[test]
fn test_given_atomic_write_to_file_when_writing_succeeds_then_file_is_created_with_expected_bytes()
{
    let dir = tempdir().expect("create tempdir");
    let target_file = dir.path().join("output.txt");
    let target_str = target_file.to_str().unwrap();

    let res = atomic_write_to_file(target_str, |writer| {
        writer
            .write_all(b"streamed atomic content")
            .map_err(|e| CliError::Sink(SinkError::Io(e.to_string())))
    });

    assert!(res.is_ok());
    assert!(target_file.exists());
    let read_back = fs::read_to_string(&target_file).expect("read file");
    assert_eq!(read_back, "streamed atomic content");

    // Verify no temporary files remain in directory
    let entries: Vec<_> = fs::read_dir(dir.path())
        .expect("read_dir")
        .filter_map(|e| e.ok())
        .collect();
    assert_eq!(entries.len(), 1);
    assert_eq!(entries[0].file_name(), "output.txt");
}

#[test]
fn test_given_atomic_write_to_file_when_overwriting_existing_file_then_overwrites_atomically() {
    let dir = tempdir().expect("create tempdir");
    let target_file = dir.path().join("overwrite.txt");
    let target_str = target_file.to_str().unwrap();

    fs::write(&target_file, b"initial version").expect("write initial");
    assert_eq!(fs::read_to_string(&target_file).unwrap(), "initial version");

    let res = atomic_write_to_file(target_str, |writer| {
        writer
            .write_all(b"replacement version")
            .map_err(|e| CliError::Sink(SinkError::Io(e.to_string())))
    });

    assert!(res.is_ok());
    assert_eq!(
        fs::read_to_string(&target_file).unwrap(),
        "replacement version"
    );

    // Verify no temporary files remain
    let entries: Vec<_> = fs::read_dir(dir.path())
        .expect("read_dir")
        .filter_map(|e| e.ok())
        .collect();
    assert_eq!(entries.len(), 1);
}

#[test]
fn test_given_atomic_write_to_file_when_write_closure_fails_then_no_partial_file_and_tmp_cleaned_up(
) {
    let dir = tempdir().expect("create tempdir");
    let target_file = dir.path().join("should_not_exist.txt");
    let target_str = target_file.to_str().unwrap();

    let res = atomic_write_to_file(target_str, |writer| {
        writer
            .write_all(b"partial uncommitted content")
            .map_err(|e| CliError::Sink(SinkError::Io(e.to_string())))?;
        Err(CliError::Sink(SinkError::Serialization(
            "intentional abort".to_string(),
        )))
    });

    assert!(res.is_err());
    assert!(!target_file.exists());

    // Verify no temporary .tmp files left in directory
    let entries: Vec<_> = fs::read_dir(dir.path())
        .expect("read_dir")
        .filter_map(|e| e.ok())
        .collect();
    assert!(
        entries.is_empty(),
        "expected empty directory, found: {:?}",
        entries
    );
}

#[test]
fn test_given_atomic_write_to_file_when_write_fails_on_existing_target_then_preserves_original_intact(
) {
    let dir = tempdir().expect("create tempdir");
    let target_file = dir.path().join("precious_data.txt");
    let target_str = target_file.to_str().unwrap();

    fs::write(&target_file, b"precious original data").expect("write initial");

    let res = atomic_write_to_file(target_str, |writer| {
        writer
            .write_all(b"corrupted partial data")
            .map_err(|e| CliError::Sink(SinkError::Io(e.to_string())))?;
        Err(CliError::Sink(SinkError::Serialization(
            "mid-stream error".to_string(),
        )))
    });

    assert!(res.is_err());
    assert_eq!(
        fs::read_to_string(&target_file).unwrap(),
        "precious original data"
    );

    // Verify only the original file exists, no leftover tmp files
    let entries: Vec<_> = fs::read_dir(dir.path())
        .expect("read_dir")
        .filter_map(|e| e.ok())
        .collect();
    assert_eq!(entries.len(), 1);
    assert_eq!(entries[0].file_name(), "precious_data.txt");
}

#[test]
fn test_given_export_to_file_when_called_then_writes_atomically_using_buf_writer() {
    let tree = create_sample_tree();
    let dir = tempdir().expect("create tempdir");
    let target_file = dir.path().join("report.csv");
    let target_str = target_file.to_str().unwrap();

    let res = export_to_file(&tree, ExportFormat::Csv, target_str);
    assert!(res.is_ok());
    assert!(target_file.exists());

    let content = fs::read_to_string(&target_file).expect("read report");
    assert!(
        content.starts_with("Project,Task,Subtask,Duration_Seconds,Duration_Formatted,Percentage")
    );
    assert!(content.contains("\"API \"\"Service\"\"\""));

    // Check no temporary files left
    let entries: Vec<_> = fs::read_dir(dir.path())
        .expect("read_dir")
        .filter_map(|e| e.ok())
        .collect();
    assert_eq!(entries.len(), 1);
}
