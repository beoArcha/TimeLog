use calamine::{Data, Reader, Xlsx};
use oxyflow_timelog::cli::exporters::{export_to_file, export_xlsx};
use oxyflow_timelog::cli::formatters::{
    ReportProjectDto, ReportSubtaskDto, ReportTaskDto, ReportTreeDto,
};
use oxyflow_timelog::cli::parser::ExportFormat;
use std::fs;
use std::io::Cursor;

fn create_sample_tree() -> ReportTreeDto {
    ReportTreeDto {
        period: "Today".to_string(),
        total_seconds: 3600,
        total_formatted: "01h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "p1".to_string(),
            name: "API \"Service\"".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t1".to_string(),
                name: "Database Setup".to_string(),
                duration_seconds: 3600,
                duration_formatted: "01h 00m".to_string(),
                percentage: 100.0,
                subtasks: vec![],
            }],
        }],
    }
}

fn create_tree_with_subtasks_and_direct_time() -> ReportTreeDto {
    ReportTreeDto {
        period: "This Week".to_string(),
        total_seconds: 3600,
        total_formatted: "01h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "p1".to_string(),
            name: "Alpha Project".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t1".to_string(),
                name: "Main Feature".to_string(),
                duration_seconds: 3600,
                duration_formatted: "01h 00m".to_string(),
                percentage: 100.0,
                subtasks: vec![
                    ReportSubtaskDto {
                        id: "s1".to_string(),
                        name: "Subtask A".to_string(),
                        duration_seconds: 1200,
                        duration_formatted: "20m 00s".to_string(),
                        percentage: 33.3,
                    },
                    ReportSubtaskDto {
                        id: "s2".to_string(),
                        name: "Subtask B".to_string(),
                        duration_seconds: 600,
                        duration_formatted: "10m 00s".to_string(),
                        percentage: 16.7,
                    },
                ],
            }],
        }],
    }
}

fn create_empty_tree() -> ReportTreeDto {
    ReportTreeDto {
        period: "Today".to_string(),
        total_seconds: 0,
        total_formatted: "00m 00s".to_string(),
        projects: vec![],
    }
}

fn create_tree_with_special_characters() -> ReportTreeDto {
    ReportTreeDto {
        period: "Period <2026> & 'Q1'".to_string(),
        total_seconds: 1800,
        total_formatted: "30m 00s".to_string(),
        projects: vec![ReportProjectDto {
            id: "p_spec".to_string(),
            name: "Projekt \"Zażółć\" <gęślą> & jaźń".to_string(),
            duration_seconds: 1800,
            duration_formatted: "30m 00s".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t_spec".to_string(),
                name: "Zadanie: 'Księgowość' & VAT 23%".to_string(),
                duration_seconds: 1800,
                duration_formatted: "30m 00s".to_string(),
                percentage: 100.0,
                subtasks: vec![],
            }],
        }],
    }
}

fn get_xlsx_cell_str(range: &calamine::Range<Data>, row: usize, col: usize) -> String {
    match range.get((row, col)) {
        Some(Data::String(s)) => s.clone(),
        Some(Data::Float(f)) => f.to_string(),
        Some(Data::Int(i)) => i.to_string(),
        Some(Data::Empty) => String::new(),
        _ => String::new(),
    }
}

fn get_xlsx_cell_f64(range: &calamine::Range<Data>, row: usize, col: usize) -> f64 {
    match range.get((row, col)) {
        Some(Data::Float(f)) => *f,
        Some(Data::Int(i)) => *i as f64,
        Some(Data::String(s)) => s.parse().unwrap_or(0.0),
        _ => 0.0,
    }
}

#[test]
fn test_given_task_without_subtasks_when_export_xlsx_then_produces_complete_and_correct_content() {
    // Arrange
    let tree = create_sample_tree();

    // Act
    let bytes = export_xlsx(&tree).expect("xlsx export should succeed");

    // Assert
    assert!(!bytes.is_empty());
    let mut excel: Xlsx<_> = Xlsx::new(Cursor::new(&bytes)).expect("must parse as xlsx");
    let range = excel
        .worksheet_range("Work Report")
        .expect("must contain Work Report worksheet");

    // Headers
    assert_eq!(get_xlsx_cell_str(&range, 0, 0), "Project");
    assert_eq!(get_xlsx_cell_str(&range, 0, 1), "Task");
    assert_eq!(get_xlsx_cell_str(&range, 0, 2), "Subtask");
    assert_eq!(get_xlsx_cell_str(&range, 0, 3), "Duration_Seconds");
    assert_eq!(get_xlsx_cell_str(&range, 0, 4), "Duration_Formatted");
    assert_eq!(get_xlsx_cell_str(&range, 0, 5), "Percentage");

    // Data Row 1 (task without subtasks)
    assert_eq!(get_xlsx_cell_str(&range, 1, 0), "API \"Service\"");
    assert_eq!(get_xlsx_cell_str(&range, 1, 1), "Database Setup");
    assert_eq!(get_xlsx_cell_str(&range, 1, 2), "");
    assert_eq!(get_xlsx_cell_f64(&range, 1, 3), 3600.0);
    assert_eq!(get_xlsx_cell_str(&range, 1, 4), "01h 00m");
    assert_eq!(get_xlsx_cell_f64(&range, 1, 5), 100.0);

    // Total Row
    assert_eq!(get_xlsx_cell_str(&range, 2, 0), "Total");
    assert_eq!(get_xlsx_cell_str(&range, 2, 1), "");
    assert_eq!(get_xlsx_cell_str(&range, 2, 2), "");
    assert_eq!(get_xlsx_cell_f64(&range, 2, 3), 3600.0);
    assert_eq!(get_xlsx_cell_str(&range, 2, 4), "01h 00m");
    assert_eq!(get_xlsx_cell_f64(&range, 2, 5), 100.0);
}

#[test]
fn test_given_task_with_subtasks_and_direct_time_when_export_xlsx_then_preserves_parent_time_and_subtasks(
) {
    // Arrange: parent has 30m direct, sub A has 20m, sub B has 10m -> total 60m
    let tree = create_tree_with_subtasks_and_direct_time();

    // Act
    let bytes = export_xlsx(&tree).expect("xlsx export should succeed");

    // Assert
    let mut excel: Xlsx<_> = Xlsx::new(Cursor::new(&bytes)).expect("must parse as xlsx");
    let range = excel
        .worksheet_range("Work Report")
        .expect("must contain Work Report worksheet");

    // Row 1: Direct parent time (30 min = 1800s, 50.0%)
    assert_eq!(get_xlsx_cell_str(&range, 1, 0), "Alpha Project");
    assert_eq!(get_xlsx_cell_str(&range, 1, 1), "Main Feature");
    assert_eq!(get_xlsx_cell_str(&range, 1, 2), "");
    assert_eq!(get_xlsx_cell_f64(&range, 1, 3), 1800.0);
    assert_eq!(get_xlsx_cell_str(&range, 1, 4), "30m 00s");
    assert!((get_xlsx_cell_f64(&range, 1, 5) - 50.0).abs() < 0.1);

    // Row 2: Subtask A (20 min = 1200s, 33.3%)
    assert_eq!(get_xlsx_cell_str(&range, 2, 0), "Alpha Project");
    assert_eq!(get_xlsx_cell_str(&range, 2, 1), "Main Feature");
    assert_eq!(get_xlsx_cell_str(&range, 2, 2), "Subtask A");
    assert_eq!(get_xlsx_cell_f64(&range, 2, 3), 1200.0);
    assert_eq!(get_xlsx_cell_str(&range, 2, 4), "20m 00s");
    assert!((get_xlsx_cell_f64(&range, 2, 5) - 33.3).abs() < 0.1);

    // Row 3: Subtask B (10 min = 600s, 16.7%)
    assert_eq!(get_xlsx_cell_str(&range, 3, 0), "Alpha Project");
    assert_eq!(get_xlsx_cell_str(&range, 3, 1), "Main Feature");
    assert_eq!(get_xlsx_cell_str(&range, 3, 2), "Subtask B");
    assert_eq!(get_xlsx_cell_f64(&range, 3, 3), 600.0);
    assert_eq!(get_xlsx_cell_str(&range, 3, 4), "10m 00s");
    assert!((get_xlsx_cell_f64(&range, 3, 5) - 16.7).abs() < 0.1);

    // Row 4: Total summary row (60 min = 3600s, 100%)
    assert_eq!(get_xlsx_cell_str(&range, 4, 0), "Total");
    assert_eq!(get_xlsx_cell_str(&range, 4, 1), "");
    assert_eq!(get_xlsx_cell_str(&range, 4, 2), "");
    assert_eq!(get_xlsx_cell_f64(&range, 4, 3), 3600.0);
    assert_eq!(get_xlsx_cell_str(&range, 4, 4), "01h 00m");
    assert_eq!(get_xlsx_cell_f64(&range, 4, 5), 100.0);

    // Verify time sum integrity: parent direct (1800) + sub A (1200) + sub B (600) = 3600
    let sum_seconds = get_xlsx_cell_f64(&range, 1, 3)
        + get_xlsx_cell_f64(&range, 2, 3)
        + get_xlsx_cell_f64(&range, 3, 3);
    assert_eq!(sum_seconds, 3600.0);
}

#[test]
fn test_given_empty_report_when_export_xlsx_then_produces_header_and_zero_total() {
    // Arrange
    let tree = create_empty_tree();

    // Act
    let bytes = export_xlsx(&tree).expect("xlsx export should succeed");

    // Assert
    let mut excel: Xlsx<_> = Xlsx::new(Cursor::new(&bytes)).expect("must parse as xlsx");
    let range = excel
        .worksheet_range("Work Report")
        .expect("must contain Work Report worksheet");

    assert_eq!(get_xlsx_cell_str(&range, 0, 0), "Project");
    assert_eq!(get_xlsx_cell_str(&range, 1, 0), "Total");
    assert_eq!(get_xlsx_cell_f64(&range, 1, 3), 0.0);
    assert_eq!(get_xlsx_cell_str(&range, 1, 4), "00m 00s");
    assert_eq!(get_xlsx_cell_f64(&range, 1, 5), 0.0);
}

#[test]
fn test_given_special_characters_when_export_xlsx_then_cells_contain_exact_strings() {
    // Arrange
    let tree = create_tree_with_special_characters();

    // Act
    let bytes = export_xlsx(&tree).expect("xlsx export should succeed");

    // Assert
    let mut excel: Xlsx<_> = Xlsx::new(Cursor::new(&bytes)).expect("must parse as xlsx");
    let range = excel
        .worksheet_range("Work Report")
        .expect("must contain Work Report worksheet");

    assert_eq!(
        get_xlsx_cell_str(&range, 1, 0),
        "Projekt \"Zażółć\" <gęślą> & jaźń"
    );
    assert_eq!(
        get_xlsx_cell_str(&range, 1, 1),
        "Zadanie: 'Księgowość' & VAT 23%"
    );
}

#[test]
fn test_given_xlsx_format_when_export_to_file_then_writes_valid_excel_with_content() {
    // Arrange
    let tree = create_sample_tree();
    let temp_dir =
        std::env::temp_dir().join(format!("oxy_test_export_xlsx_{}", uuid::Uuid::new_v4()));
    let target_file = temp_dir.join("report.xlsx");
    let target_path_str = target_file.to_str().unwrap();

    // Act
    let res = export_to_file(&tree, ExportFormat::Xlsx, target_path_str);

    // Assert
    assert!(res.is_ok());
    assert!(target_file.exists());

    let mut excel: Xlsx<_> =
        calamine::open_workbook(&target_file).expect("failed to open exported file");
    let range = excel
        .worksheet_range("Work Report")
        .expect("must contain Work Report worksheet");
    assert_eq!(get_xlsx_cell_str(&range, 0, 0), "Project");
    assert_eq!(get_xlsx_cell_str(&range, 1, 1), "Database Setup");
    assert_eq!(get_xlsx_cell_f64(&range, 2, 3), 3600.0);

    // Cleanup
    let _ = fs::remove_dir_all(temp_dir);
}
