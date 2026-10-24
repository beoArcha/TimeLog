use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::formatters::ReportTreeDto;
use oxy_flow::cli::{handle_cli, CliArgs, CliOutput};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::NewTimeLog;
use rusqlite::Connection;
use std::fs;

fn setup_dataset(db_name: &str) -> (Persistence, Connection, crate::shared::test_db::TempCsvDir) {
    let (conn, config, temp_dir) = setup_persistence_test(db_name);
    let persistence = Persistence::new(&config).expect("failed to create persistence layer");

    let project = ProjectBuilder::new()
        .with_id("p_rep_sub_01")
        .with_name("Export System")
        .with_color("teal")
        .build();
    let task = TaskBuilder::new()
        .with_id("t_rep_sub_01")
        .with_project_id("p_rep_sub_01")
        .with_name("Invoice Generation")
        .build();

    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();

    let now_utc = chrono::Utc::now();
    let start_iso = (now_utc - chrono::Duration::hours(3)).to_rfc3339();
    let end_iso = (now_utc - chrono::Duration::hours(1)).to_rfc3339();

    let new_log = NewTimeLog {
        id: "log_rep_sub_01".to_string(),
        task_id: "t_rep_sub_01".to_string(),
        start_time: start_iso,
        end_time: Some(end_iso),
        note: Some("Quarterly financial report".to_string()),
    };
    persistence.time_logs.insert_full(&new_log).unwrap();

    (persistence, conn, temp_dir)
}

#[test]
fn test_given_logged_work_when_report_tree_invoked_then_outputs_unicode_tree() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_reports_tree_unicode");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "report", "--tree"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let display_str = result.unwrap().to_string();
    assert!(display_str.contains("Export System"));
    assert!(display_str.contains("Invoice Generation"));
    assert!(display_str.contains("02h 00m"));
    assert!(display_str.contains("█"));
}

#[test]
fn test_given_logged_work_when_report_invoked_with_machine_flag_then_outputs_clean_json_tree() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_reports_machine_json");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from(["oxy", "-m", "report"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    match result.unwrap() {
        CliOutput::Json(ref json_str) => {
            let tree: ReportTreeDto =
                serde_json::from_str(json_str).expect("output must be valid ReportTreeDto JSON");
            assert_eq!(tree.projects.len(), 1);
            assert_eq!(tree.projects[0].name, "Export System");
            assert_eq!(tree.total_seconds, 7200);
        }
        other => panic!("Expected CliOutput::Json, got {:?}", other),
    }
}

#[test]
fn test_given_logged_work_when_exporting_to_html_then_generates_valid_html_report_file() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_html");
    let engine = Engine::new(&persistence);
    let output_file =
        std::env::temp_dir().join(format!("report_export_{}.html", uuid::Uuid::new_v4()));
    let output_path = output_file.to_str().unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "report", "export", "-f", "html", "-o", output_path])
            .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    assert!(output_file.exists());

    let content = fs::read_to_string(&output_file).expect("failed to read exported HTML");
    assert!(content.contains("<!DOCTYPE html>"));
    assert!(content.contains("Export System"));
    assert!(content.contains("Invoice Generation"));
    assert!(content.contains("02h 00m"));

    let _ = fs::remove_file(output_file);
}

#[test]
fn test_given_logged_work_when_exporting_to_csv_then_generates_valid_tabular_csv_file() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_csv");
    let engine = Engine::new(&persistence);
    let output_file =
        std::env::temp_dir().join(format!("report_export_{}.csv", uuid::Uuid::new_v4()));
    let output_path = output_file.to_str().unwrap();

    let args = CliArgs::try_parse_from(["oxy", "report", "export", "-f", "csv", "-o", output_path])
        .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    assert!(output_file.exists());

    let content = fs::read_to_string(&output_file).expect("failed to read exported CSV");
    assert!(content.contains("Project,Task,Subtask,Duration_Seconds,Duration_Formatted,Percentage"));
    assert!(content.contains("Export System"));
    assert!(content.contains("Invoice Generation"));
    assert!(content.contains("7200"));

    let _ = fs::remove_file(output_file);
}

#[test]
fn test_given_logged_work_when_exporting_to_json_then_generates_valid_json_report_file() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_json");
    let engine = Engine::new(&persistence);
    let output_file =
        std::env::temp_dir().join(format!("report_export_{}.json", uuid::Uuid::new_v4()));
    let output_path = output_file.to_str().unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "report", "export", "-f", "json", "-o", output_path])
            .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    assert!(output_file.exists());

    let content = fs::read_to_string(&output_file).expect("failed to read exported JSON");
    let tree: ReportTreeDto =
        serde_json::from_str(&content).expect("content must parse into ReportTreeDto");
    assert_eq!(tree.projects.len(), 1);
    assert_eq!(tree.projects[0].name, "Export System");
    assert_eq!(tree.total_seconds, 7200);

    let _ = fs::remove_file(output_file);
}

#[test]
fn test_given_invalid_path_when_exporting_then_fails_with_sink_error_exit_code_1() {
    // Given
    let (persistence, _conn, _temp) = setup_dataset("test_reports_export_io_err");
    let engine = Engine::new(&persistence);
    let invalid_path = if cfg!(windows) {
        "Z:\\non_existent_drive_xyz\\report.csv"
    } else {
        "/non_existent_dir_xyz/deeply/nested/report.csv"
    };

    let args =
        CliArgs::try_parse_from(["oxy", "report", "export", "-f", "csv", "-o", invalid_path])
            .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 1);
    let envelope = err.to_envelope(None);
    assert_eq!(envelope.code, "SNK_EXTERNAL_IO");
}

#[test]
fn test_given_date_range_when_report_invoked_then_scopes_to_exact_bounds() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_reports_date_range");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_range_1")
        .with_name("Range Project")
        .build();
    let task = TaskBuilder::new()
        .with_id("t_range_1")
        .with_project_id("p_range_1")
        .with_name("Range Task")
        .build();
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();

    let old_log = NewTimeLog {
        id: "log_old".to_string(),
        task_id: "t_range_1".to_string(),
        start_time: "2026-05-10T10:00:00Z".to_string(),
        end_time: Some("2026-05-10T12:00:00Z".to_string()),
        note: None,
    };
    let current_log = NewTimeLog {
        id: "log_current".to_string(),
        task_id: "t_range_1".to_string(),
        start_time: "2026-10-15T10:00:00Z".to_string(),
        end_time: Some("2026-10-15T11:00:00Z".to_string()),
        note: None,
    };
    persistence.time_logs.insert_full(&old_log).unwrap();
    persistence.time_logs.insert_full(&current_log).unwrap();

    let args = CliArgs::try_parse_from([
        "oxy",
        "--json",
        "report",
        "--from",
        "2026-10-01",
        "--to",
        "2026-10-31",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    if let CliOutput::Json(ref json_str) = result.unwrap() {
        let tree: ReportTreeDto = serde_json::from_str(json_str).unwrap();
        assert_eq!(tree.total_seconds, 3600);
        assert_eq!(tree.projects.len(), 1);
        assert_eq!(tree.period, "2026-10-01 to 2026-10-31");
    } else {
        panic!("Expected CliOutput::Json");
    }
}

#[test]
fn test_given_inverted_date_bounds_when_report_invoked_then_fails_with_business_error() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_reports_inverted_dates");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let args = CliArgs::try_parse_from([
        "oxy",
        "report",
        "--from",
        "2026-10-31",
        "--to",
        "2026-10-01",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 1);
    assert!(err
        .to_string()
        .contains("Filter start date cannot be after end date."));
}

#[test]
fn test_given_multiple_projects_when_report_filtered_by_project_then_scopes_output() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_reports_filter_project");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj_a = ProjectBuilder::new()
        .with_id("p_alpha")
        .with_name("Alpha Services")
        .build();
    let proj_b = ProjectBuilder::new()
        .with_id("p_beta")
        .with_name("Beta Services")
        .build();
    persistence.projects.create(proj_a).unwrap();
    persistence.projects.create(proj_b).unwrap();

    let task_a = TaskBuilder::new()
        .with_id("t_alpha")
        .with_project_id("p_alpha")
        .with_name("Alpha Task")
        .build();
    let task_b = TaskBuilder::new()
        .with_id("t_beta")
        .with_project_id("p_beta")
        .with_name("Beta Task")
        .build();
    persistence.tasks.create(task_a).unwrap();
    persistence.tasks.create(task_b).unwrap();

    let log_a = NewTimeLog {
        id: "l_alpha".to_string(),
        task_id: "t_alpha".to_string(),
        start_time: "2026-10-24T10:00:00Z".to_string(),
        end_time: Some("2026-10-24T11:00:00Z".to_string()),
        note: None,
    };
    let log_b = NewTimeLog {
        id: "l_beta".to_string(),
        task_id: "t_beta".to_string(),
        start_time: "2026-10-24T10:00:00Z".to_string(),
        end_time: Some("2026-10-24T12:00:00Z".to_string()),
        note: None,
    };
    persistence.time_logs.insert_full(&log_a).unwrap();
    persistence.time_logs.insert_full(&log_b).unwrap();

    let args = CliArgs::try_parse_from(["oxy", "-m", "report", "-p", "Alpha Services"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    if let CliOutput::Json(ref json_str) = result.unwrap() {
        let tree: ReportTreeDto = serde_json::from_str(json_str).unwrap();
        assert_eq!(tree.projects.len(), 1);
        assert_eq!(tree.projects[0].name, "Alpha Services");
        assert_eq!(tree.total_seconds, 3600);
    } else {
        panic!("Expected CliOutput::Json");
    }
}

#[test]
fn test_given_task_filter_when_report_invoked_then_scopes_output_to_that_task() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_reports_filter_task");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p_gamma")
        .with_name("Gamma Project")
        .build();
    persistence.projects.create(proj).unwrap();

    let task_1 = TaskBuilder::new()
        .with_id("t_gamma_1")
        .with_project_id("p_gamma")
        .with_name("Task One")
        .build();
    let task_2 = TaskBuilder::new()
        .with_id("t_gamma_2")
        .with_project_id("p_gamma")
        .with_name("Task Two")
        .build();
    persistence.tasks.create(task_1).unwrap();
    persistence.tasks.create(task_2).unwrap();

    let log_1 = NewTimeLog {
        id: "l_gamma_1".to_string(),
        task_id: "t_gamma_1".to_string(),
        start_time: "2026-10-24T09:00:00Z".to_string(),
        end_time: Some("2026-10-24T10:00:00Z".to_string()),
        note: None,
    };
    let log_2 = NewTimeLog {
        id: "l_gamma_2".to_string(),
        task_id: "t_gamma_2".to_string(),
        start_time: "2026-10-24T10:00:00Z".to_string(),
        end_time: Some("2026-10-24T12:00:00Z".to_string()),
        note: None,
    };
    persistence.time_logs.insert_full(&log_1).unwrap();
    persistence.time_logs.insert_full(&log_2).unwrap();

    let args = CliArgs::try_parse_from(["oxy", "-m", "report", "-t", "Task One"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    if let CliOutput::Json(ref json_str) = result.unwrap() {
        let tree: ReportTreeDto = serde_json::from_str(json_str).unwrap();
        assert_eq!(tree.total_seconds, 3600);
        assert_eq!(tree.projects[0].tasks.len(), 1);
        assert_eq!(tree.projects[0].tasks[0].name, "Task One");
    } else {
        panic!("Expected CliOutput::Json");
    }
}

#[test]
fn test_given_task_not_in_specified_project_when_report_invoked_then_fails_with_business_error() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_reports_mismatched_task_proj");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj_a = ProjectBuilder::new()
        .with_id("p_delta_a")
        .with_name("Delta A")
        .build();
    let proj_b = ProjectBuilder::new()
        .with_id("p_delta_b")
        .with_name("Delta B")
        .build();
    persistence.projects.create(proj_a).unwrap();
    persistence.projects.create(proj_b).unwrap();

    let task_b = TaskBuilder::new()
        .with_id("t_delta_b")
        .with_project_id("p_delta_b")
        .with_name("Task in B")
        .build();
    persistence.tasks.create(task_b).unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "report", "-p", "Delta A", "-t", "Task in B"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 1);
    assert!(err.to_string().contains("does not belong to project"));
}
