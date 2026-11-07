use super::exporter_fixtures::*;
use oxyflow_timelog::cli::exporters::{export_csv, sanitize_csv, sanitize_csv_formula};
use oxyflow_timelog::cli::formatters::{ReportProjectDto, ReportTaskDto, ReportTreeDto};

#[test]
fn test_given_tree_when_export_csv_then_contains_header_and_rfc4180_quotes() {
    let tree = create_sample_tree();
    let csv = export_csv(&tree).unwrap();

    assert!(csv.starts_with("Project,Task,Subtask,Duration_Seconds,Duration_Formatted,Percentage"));
    assert!(csv.contains("\"API \"\"Service\"\"\""));
    assert!(csv.contains("\"Database Setup\""));
    assert!(csv.contains("3600"));
}

#[test]
fn test_given_task_with_subtasks_and_direct_time_when_export_csv_then_preserves_parent_time_and_subtasks(
) {
    let tree = create_tree_with_subtasks_and_direct_time();
    let csv = export_csv(&tree).unwrap();

    let lines: Vec<&str> = csv.lines().collect();
    assert_eq!(
        lines[0],
        "Project,Task,Subtask,Duration_Seconds,Duration_Formatted,Percentage"
    );
    assert_eq!(
        lines[1],
        "\"Alpha Project\",\"Main Feature\",\"\",1800,\"30m 00s\",50.0"
    );
    assert_eq!(
        lines[2],
        "\"Alpha Project\",\"Main Feature\",\"Subtask A\",1200,\"20m 00s\",33.3"
    );
    assert_eq!(
        lines[3],
        "\"Alpha Project\",\"Main Feature\",\"Subtask B\",600,\"10m 00s\",16.7"
    );
}

#[test]
fn test_given_empty_report_when_export_csv_then_produces_only_header() {
    let tree = create_empty_tree();
    let csv = export_csv(&tree).unwrap();

    let lines: Vec<&str> = csv.lines().collect();
    assert_eq!(
        lines[0],
        "Project,Task,Subtask,Duration_Seconds,Duration_Formatted,Percentage"
    );
    assert_eq!(lines.len(), 1);
}

#[test]
fn test_given_formula_triggers_when_sanitize_csv_formula_then_neutralizes_with_apostrophe() {
    assert_eq!(sanitize_csv_formula("=1+1"), "'=1+1");
    assert_eq!(sanitize_csv_formula("@SUM(A1:A2)"), "'@SUM(A1:A2)");
    assert_eq!(
        sanitize_csv_formula("+cmd|' /C calc'!A0"),
        "'+cmd|' /C calc'!A0"
    );
    assert_eq!(sanitize_csv_formula("-calc"), "'-calc");
}

#[test]
fn test_given_leading_whitespace_and_control_chars_when_sanitize_csv_formula_then_neutralizes() {
    assert_eq!(sanitize_csv_formula("   =1+1"), "'   =1+1");
    assert_eq!(sanitize_csv_formula("\t@SUM(A1:A2)"), "'\t@SUM(A1:A2)");
    assert_eq!(
        sanitize_csv_formula("\r\n+cmd|' /C calc'!A0"),
        "'\r\n+cmd|' /C calc'!A0"
    );
    assert_eq!(sanitize_csv_formula("\x00-calc"), "'\x00-calc");
}

#[test]
fn test_given_plain_text_and_empty_values_when_sanitize_csv_formula_then_leaves_unchanged() {
    assert_eq!(sanitize_csv_formula(""), "");
    assert_eq!(sanitize_csv_formula("   "), "   ");
    assert_eq!(sanitize_csv_formula("Regular Project"), "Regular Project");
    assert_eq!(sanitize_csv_formula("Task #42"), "Task #42");
    assert_eq!(sanitize_csv_formula("Alpha & Omega"), "Alpha & Omega");
}

#[test]
fn test_given_numeric_values_including_negatives_when_sanitize_csv_formula_then_preserves_numbers()
{
    assert_eq!(sanitize_csv_formula("123"), "123");
    assert_eq!(sanitize_csv_formula("+123"), "+123");
    assert_eq!(sanitize_csv_formula("-123"), "-123");
    assert_eq!(sanitize_csv_formula("-123.45"), "-123.45");
    assert_eq!(sanitize_csv_formula("+42.0"), "+42.0");
    assert_eq!(sanitize_csv_formula("0"), "0");
    assert_eq!(sanitize_csv_formula("-0"), "-0");
    assert_eq!(sanitize_csv_formula(".5"), ".5");
    assert_eq!(sanitize_csv_formula("-.5"), "-.5");
    assert_eq!(sanitize_csv_formula("1e5"), "1e5");
    assert_eq!(sanitize_csv_formula("-1e-3"), "-1e-3");
}

#[test]
fn test_given_quotes_inside_formula_when_sanitize_csv_then_neutralizes_and_doubles_quotes() {
    let raw = "=HYPERLINK(\"http://evil.com\",\"Click\")";
    let sanitized = sanitize_csv(raw);

    assert_eq!(
        sanitized,
        "'=HYPERLINK(\"\"http://evil.com\"\",\"\"Click\"\")"
    );
}

#[test]
fn test_given_tree_with_formula_injection_when_export_csv_then_neutralizes_all_text_cells() {
    let tree = ReportTreeDto {
        period: "day".to_string(),
        total_seconds: 3600,
        total_formatted: "01:00:00".to_string(),
        projects: vec![ReportProjectDto {
            id: "p1".to_string(),
            name: "=1+1".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01:00:00".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t1".to_string(),
                name: "+cmd|' /C calc'!A0".to_string(),
                duration_seconds: 3600,
                duration_formatted: "01:00:00".to_string(),
                percentage: 100.0,
                subtasks: vec![],
            }],
        }],
        entries: vec![],
    };

    let csv = export_csv(&tree).unwrap();

    let lines: Vec<&str> = csv.lines().collect();
    assert_eq!(lines.len(), 2);
    assert_eq!(
        lines[1],
        "\"'=1+1\",\"'+cmd|' /C calc'!A0\",\"\",3600,\"01:00:00\",100.0"
    );
}
