use super::exporter_fixtures::*;
use crate::shared::spreadsheet_helpers::{get_ods_cell_f64, get_ods_cell_str};
use oxyflow_timelog::cli::error::{CliError, SinkError};
use oxyflow_timelog::cli::exporters::ods::{export_ods, map_ods_err};
use spreadsheet_ods::{read_ods_buf, OdsError};

#[test]
fn test_given_ods_error_when_mapping_then_returns_sink_serialization_error() {
    let err = OdsError::Ods("custom ods test error".to_string());
    let cli_err = map_ods_err(err);
    match cli_err {
        CliError::Sink(SinkError::Serialization(msg)) => {
            assert!(msg.contains("custom ods test error"));
        }
        other => panic!(
            "expected CliError::Sink(SinkError::Serialization), got {:?}",
            other
        ),
    }
}

#[test]
fn test_given_task_without_subtasks_when_export_ods_then_produces_complete_and_correct_content() {
    let tree = create_sample_tree();
    let bytes = export_ods(&tree).expect("ods export should succeed");

    assert!(!bytes.is_empty());
    let ods = read_ods_buf(&bytes).expect("must parse as ods");
    let sheet = ods.sheet(0);
    assert_eq!(sheet.name(), "Work Report");

    // Headers
    assert_eq!(get_ods_cell_str(sheet, 0, 0), "Project");
    assert_eq!(get_ods_cell_str(sheet, 0, 1), "Task");
    assert_eq!(get_ods_cell_str(sheet, 0, 2), "Subtask");
    assert_eq!(get_ods_cell_str(sheet, 0, 3), "Duration_Seconds");
    assert_eq!(get_ods_cell_str(sheet, 0, 4), "Duration_Formatted");
    assert_eq!(get_ods_cell_str(sheet, 0, 5), "Percentage");

    // Data Row 1
    assert_eq!(get_ods_cell_str(sheet, 1, 0), "API \"Service\"");
    assert_eq!(get_ods_cell_str(sheet, 1, 1), "Database Setup");
    assert_eq!(get_ods_cell_str(sheet, 1, 2), "");
    assert_eq!(get_ods_cell_f64(sheet, 1, 3), 3600.0);
    assert_eq!(get_ods_cell_str(sheet, 1, 4), "01h 00m");
    assert_eq!(get_ods_cell_f64(sheet, 1, 5), 100.0);

    // Total Row
    assert_eq!(get_ods_cell_str(sheet, 2, 0), "Total");
    assert_eq!(get_ods_cell_str(sheet, 2, 1), "");
    assert_eq!(get_ods_cell_str(sheet, 2, 2), "");
    assert_eq!(get_ods_cell_f64(sheet, 2, 3), 3600.0);
    assert_eq!(get_ods_cell_str(sheet, 2, 4), "01h 00m");
    assert_eq!(get_ods_cell_f64(sheet, 2, 5), 100.0);
}

#[test]
fn test_given_task_with_subtasks_and_direct_time_when_export_ods_then_preserves_parent_time_and_subtasks(
) {
    // Arrange: parent has 30m direct, sub A has 20m, sub B has 10m -> total 60m
    let tree = create_tree_with_subtasks_and_direct_time();
    let bytes = export_ods(&tree).expect("ods export should succeed");

    let ods = read_ods_buf(&bytes).expect("must parse as ods");
    let sheet = ods.sheet(0);

    // Row 1: Direct parent time (30 min = 1800s, 50.0%)
    assert_eq!(get_ods_cell_str(sheet, 1, 0), "Alpha Project");
    assert_eq!(get_ods_cell_str(sheet, 1, 1), "Main Feature");
    assert_eq!(get_ods_cell_str(sheet, 1, 2), "");
    assert_eq!(get_ods_cell_f64(sheet, 1, 3), 1800.0);
    assert_eq!(get_ods_cell_str(sheet, 1, 4), "30m 00s");
    assert!((get_ods_cell_f64(sheet, 1, 5) - 50.0).abs() < 0.1);

    // Row 2: Subtask A (20 min = 1200s, 33.3%)
    assert_eq!(get_ods_cell_str(sheet, 2, 0), "Alpha Project");
    assert_eq!(get_ods_cell_str(sheet, 2, 1), "Main Feature");
    assert_eq!(get_ods_cell_str(sheet, 2, 2), "Subtask A");
    assert_eq!(get_ods_cell_f64(sheet, 2, 3), 1200.0);
    assert_eq!(get_ods_cell_str(sheet, 2, 4), "20m 00s");
    assert!((get_ods_cell_f64(sheet, 2, 5) - 33.3).abs() < 0.1);

    // Row 3: Subtask B (10 min = 600s, 16.7%)
    assert_eq!(get_ods_cell_str(sheet, 3, 0), "Alpha Project");
    assert_eq!(get_ods_cell_str(sheet, 3, 1), "Main Feature");
    assert_eq!(get_ods_cell_str(sheet, 3, 2), "Subtask B");
    assert_eq!(get_ods_cell_f64(sheet, 3, 3), 600.0);
    assert_eq!(get_ods_cell_str(sheet, 3, 4), "10m 00s");
    assert!((get_ods_cell_f64(sheet, 3, 5) - 16.7).abs() < 0.1);

    // Row 4: Total summary row (60 min = 3600s, 100%)
    assert_eq!(get_ods_cell_str(sheet, 4, 0), "Total");
    assert_eq!(get_ods_cell_str(sheet, 4, 1), "");
    assert_eq!(get_ods_cell_str(sheet, 4, 2), "");
    assert_eq!(get_ods_cell_f64(sheet, 4, 3), 3600.0);
    assert_eq!(get_ods_cell_str(sheet, 4, 4), "01h 00m");
    assert_eq!(get_ods_cell_f64(sheet, 4, 5), 100.0);

    // Verify time sum integrity: parent direct (1800) + sub A (1200) + sub B (600) = 3600
    let sum_seconds = get_ods_cell_f64(sheet, 1, 3)
        + get_ods_cell_f64(sheet, 2, 3)
        + get_ods_cell_f64(sheet, 3, 3);
    assert_eq!(sum_seconds, 3600.0);
}

#[test]
fn test_given_empty_report_when_export_ods_then_produces_header_and_zero_total() {
    let tree = create_empty_tree();
    let bytes = export_ods(&tree).expect("ods export should succeed");

    let ods = read_ods_buf(&bytes).expect("must parse as ods");
    let sheet = ods.sheet(0);

    assert_eq!(get_ods_cell_str(sheet, 0, 0), "Project");
    assert_eq!(get_ods_cell_str(sheet, 1, 0), "Total");
    assert_eq!(get_ods_cell_f64(sheet, 1, 3), 0.0);
    assert_eq!(get_ods_cell_str(sheet, 1, 4), "00m 00s");
    assert_eq!(get_ods_cell_f64(sheet, 1, 5), 0.0);
}

#[test]
fn test_given_special_characters_when_export_ods_then_cells_contain_exact_strings() {
    let tree = create_tree_with_special_characters();
    let bytes = export_ods(&tree).expect("ods export should succeed");

    let ods = read_ods_buf(&bytes).expect("must parse as ods");
    let sheet = ods.sheet(0);

    assert_eq!(
        get_ods_cell_str(sheet, 1, 0),
        "Projekt \"Zażółć\" <gęślą> & jaźń"
    );
    assert_eq!(
        get_ods_cell_str(sheet, 1, 1),
        "Zadanie: 'Księgowość' & VAT 23%"
    );
}
