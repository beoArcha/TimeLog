use crate::shared::builders::{PatchLogBuilder, ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxyflow_timelog::cli::formatters::ReportTreeDto;
use oxyflow_timelog::cli::{handle_cli, CliArgs, CliOutput};
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::NewTimeLog;
use rusqlite::Connection;

fn setup_golden_dataset(
    db_name: &str,
) -> (Persistence, Connection, crate::shared::test_db::TempCsvDir) {
    let (conn, config, temp_dir) = setup_persistence_test(db_name);
    let persistence = Persistence::new(&config).expect("failed to create persistence layer");

    let p1 = ProjectBuilder::new()
        .with_id("p_gold_1")
        .with_name("Project Alpha")
        .with_color("blue")
        .build();
    let p2 = ProjectBuilder::new()
        .with_id("p_gold_2")
        .with_name("Project Beta")
        .with_color("green")
        .build();
    persistence.projects.create(p1).unwrap();
    persistence.projects.create(p2).unwrap();

    let t1_root = TaskBuilder::new()
        .with_id("t_gold_root_1")
        .with_project_id("p_gold_1")
        .with_name("Backend Refactor")
        .build();
    let t1_sub = TaskBuilder::new()
        .with_id("t_gold_sub_1")
        .with_project_id("p_gold_1")
        .with_parent("t_gold_root_1")
        .with_name("Cli Subtask")
        .build();
    let t2_root = TaskBuilder::new()
        .with_id("t_gold_root_2")
        .with_project_id("p_gold_2")
        .with_name("Documentation")
        .build();

    persistence.tasks.create(t1_root).unwrap();
    persistence.tasks.create_subtask(t1_sub).unwrap();
    persistence.tasks.create(t2_root).unwrap();

    // 1. Log on subtask (1h: 09:00 - 10:00 UTC)
    let log_sub = NewTimeLog {
        id: "log_sub".to_string(),
        task_id: "t_gold_sub_1".to_string(),
        start_time: "2026-10-15T09:00:00Z".to_string(),
        end_time: Some("2026-10-15T10:00:00Z".to_string()),
        note: Some("Subtask work".to_string()),
    };
    persistence.time_logs.insert_full(&log_sub).unwrap();

    // 2. Log on root task (1h: 11:00 - 12:00 UTC)
    let log_root = NewTimeLog {
        id: "log_root".to_string(),
        task_id: "t_gold_root_1".to_string(),
        start_time: "2026-10-15T11:00:00Z".to_string(),
        end_time: Some("2026-10-15T12:00:00Z".to_string()),
        note: Some("Root work".to_string()),
    };
    persistence.time_logs.insert_full(&log_root).unwrap();

    // 3. Clamped cross-midnight entry (22:00 Oct 14 to 02:00 Oct 15 -> 2h in range)
    let log_midnight = NewTimeLog {
        id: "log_midnight".to_string(),
        task_id: "t_gold_root_2".to_string(),
        start_time: "2026-10-14T22:00:00Z".to_string(),
        end_time: Some("2026-10-15T02:00:00Z".to_string()),
        note: Some("Cross midnight work".to_string()),
    };
    persistence.time_logs.insert_full(&log_midnight).unwrap();

    // 4. Patch with a task (1h: 14:00 - 15:00 UTC)
    let patch_task = PatchLogBuilder::new()
        .with_id("patch_task")
        .with_project_id("p_gold_2")
        .with_task_id("t_gold_root_2")
        .with_start_time("2026-10-15T14:00:00Z")
        .with_end_time("2026-10-15T15:00:00Z")
        .with_note("Task patch adjustment")
        .build();

    // 5. Patch without a task (project-level, 30m: 16:00 - 16:30 UTC)
    let patch_proj = PatchLogBuilder::new()
        .with_id("patch_proj")
        .with_project_id("p_gold_1")
        .with_start_time("2026-10-15T16:00:00Z")
        .with_end_time("2026-10-15T16:30:00Z")
        .with_note("Project patch adjustment")
        .build();

    persistence
        .patches
        .save(vec![patch_task, patch_proj])
        .unwrap();

    (persistence, conn, temp_dir)
}

#[test]
fn test_given_seeded_fixture_when_report_invoked_human_then_matches_golden_output() {
    // Given
    let (persistence, _conn, _temp) = setup_golden_dataset("golden_report_human");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from([
        "oxy",
        "report",
        "--from",
        "2026-10-15",
        "--to",
        "2026-10-15",
        "--tz",
        "UTC",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let output = result.unwrap();
    let text = output.to_string();

    assert!(text.contains("Custom Range, UTC"));
    assert!(text.contains("Project Beta"));
    assert!(text.contains("Project Alpha"));
    assert!(text.contains("Documentation"));
    assert!(text.contains("Backend Refactor"));
    assert!(text.contains("Cli Subtask"));
    assert!(text.contains("05h 30m"));
    assert!(text.contains("03h 00m"));
    assert!(text.contains("02h 30m"));
    assert!(text.contains("02h 00m"));
    assert!(text.contains("01h 00m"));
}

#[test]
fn test_given_seeded_fixture_when_report_invoked_json_then_matches_golden_contract() {
    // Given
    let (persistence, _conn, _temp) = setup_golden_dataset("golden_report_json");
    let engine = Engine::new(&persistence);
    let args = CliArgs::try_parse_from([
        "oxy",
        "--json",
        "report",
        "--from",
        "2026-10-15",
        "--to",
        "2026-10-15",
        "--tz",
        "UTC",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let CliOutput::Json(json_str) = result.unwrap() else {
        panic!("expected json output");
    };
    let tree: ReportTreeDto = serde_json::from_str(&json_str).expect("valid ReportTreeDto");

    assert_eq!(tree.period, "Custom Range, UTC");
    assert_eq!(tree.total_seconds, 19800);
    assert_eq!(tree.total_formatted, "05h 30m");
    assert_eq!(tree.projects.len(), 2);

    // Project Beta (10800s = 03h 00m, 54.5%)
    let pb = &tree.projects[0];
    assert_eq!(pb.id, "p_gold_2");
    assert_eq!(pb.name, "Project Beta");
    assert_eq!(pb.duration_seconds, 10800);
    assert_eq!(pb.duration_formatted, "03h 00m");
    assert!((pb.percentage - 54.5454).abs() < 0.1);
    assert_eq!(pb.tasks.len(), 1);
    let doc_task = &pb.tasks[0];
    assert_eq!(doc_task.id, "t_gold_root_2");
    assert_eq!(doc_task.name, "Documentation");
    assert_eq!(doc_task.duration_seconds, 10800);
    assert_eq!(doc_task.duration_formatted, "03h 00m");
    assert_eq!(doc_task.subtasks.len(), 0);

    // Project Alpha (9000s = 02h 30m, 45.5%)
    let pa = &tree.projects[1];
    assert_eq!(pa.id, "p_gold_1");
    assert_eq!(pa.name, "Project Alpha");
    assert_eq!(pa.duration_seconds, 9000);
    assert_eq!(pa.duration_formatted, "02h 30m");
    assert!((pa.percentage - 45.4545).abs() < 0.1);
    assert_eq!(pa.tasks.len(), 1);
    let refactor_task = &pa.tasks[0];
    assert_eq!(refactor_task.id, "t_gold_root_1");
    assert_eq!(refactor_task.name, "Backend Refactor");
    assert_eq!(refactor_task.duration_seconds, 7200);
    assert_eq!(refactor_task.duration_formatted, "02h 00m");
    assert_eq!(refactor_task.subtasks.len(), 1);
    let sub = &refactor_task.subtasks[0];
    assert_eq!(sub.id, "t_gold_sub_1");
    assert_eq!(sub.name, "Cli Subtask");
    assert_eq!(sub.duration_seconds, 3600);
    assert_eq!(sub.duration_formatted, "01h 00m");

    // Entries: 5 entries
    assert_eq!(tree.entries.len(), 5);

    // Subtask log
    let e_sub = tree
        .entries
        .iter()
        .find(|e| e.id == "log_sub")
        .expect("log_sub entry");
    assert_eq!(e_sub.date, "2026-10-15");
    assert_eq!(e_sub.project_name, "Project Alpha");
    assert_eq!(e_sub.task_name, "Backend Refactor");
    assert_eq!(e_sub.subtask_name.as_deref(), Some("Cli Subtask"));
    assert_eq!(e_sub.duration_seconds, 3600);
    assert_eq!(e_sub.duration_formatted, "01h 00m");
    assert_eq!(e_sub.note.as_deref(), Some("Subtask work"));

    // Root log
    let e_root = tree
        .entries
        .iter()
        .find(|e| e.id == "log_root")
        .expect("log_root entry");
    assert_eq!(e_root.date, "2026-10-15");
    assert_eq!(e_root.project_name, "Project Alpha");
    assert_eq!(e_root.task_name, "Backend Refactor");
    assert_eq!(e_root.subtask_name, None);
    assert_eq!(e_root.duration_seconds, 3600);
    assert_eq!(e_root.duration_formatted, "01h 00m");
    assert_eq!(e_root.note.as_deref(), Some("Root work"));

    // Midnight log (clamped to 2h)
    let e_midnight = tree
        .entries
        .iter()
        .find(|e| e.id == "log_midnight")
        .expect("log_midnight entry");
    assert_eq!(e_midnight.date, "2026-10-15");
    assert_eq!(e_midnight.project_name, "Project Beta");
    assert_eq!(e_midnight.task_name, "Documentation");
    assert_eq!(e_midnight.subtask_name, None);
    assert_eq!(e_midnight.duration_seconds, 7200);
    assert_eq!(e_midnight.duration_formatted, "02h 00m");
    assert_eq!(e_midnight.note.as_deref(), Some("Cross midnight work"));

    // Task patch
    let e_task_patch = tree
        .entries
        .iter()
        .find(|e| e.id == "patch_task")
        .expect("patch_task entry");
    assert_eq!(e_task_patch.date, "2026-10-15");
    assert_eq!(e_task_patch.project_name, "Project Beta");
    assert_eq!(e_task_patch.task_name, "Documentation");
    assert_eq!(e_task_patch.subtask_name, None);
    assert_eq!(e_task_patch.duration_seconds, 3600);
    assert_eq!(e_task_patch.duration_formatted, "01h 00m");
    assert_eq!(e_task_patch.note.as_deref(), Some("Task patch adjustment"));

    // Project patch
    let e_proj_patch = tree
        .entries
        .iter()
        .find(|e| e.id == "patch_proj")
        .expect("patch_proj entry");
    assert_eq!(e_proj_patch.date, "2026-10-15");
    assert_eq!(e_proj_patch.project_name, "Project Alpha");
    assert_eq!(e_proj_patch.task_name, "");
    assert_eq!(e_proj_patch.subtask_name, None);
    assert_eq!(e_proj_patch.duration_seconds, 1800);
    assert_eq!(e_proj_patch.duration_formatted, "30m 00s");
    assert_eq!(
        e_proj_patch.note.as_deref(),
        Some("Project patch adjustment")
    );
}

#[test]
fn test_given_empty_range_when_report_invoked_human_and_json_then_outputs_empty_contract() {
    // Given
    let (persistence, _conn, _temp) = setup_golden_dataset("golden_report_empty");
    let engine = Engine::new(&persistence);

    // When (Human)
    let args_human = CliArgs::try_parse_from([
        "oxy",
        "report",
        "--from",
        "2026-01-01",
        "--to",
        "2026-01-02",
        "--tz",
        "UTC",
    ])
    .unwrap();
    let result_human = handle_cli(args_human, &persistence, &engine);

    // Then (Human)
    assert!(result_human.is_ok());
    assert_eq!(
        result_human.unwrap().to_string(),
        "✅ No time logs recorded for the selected period."
    );

    // When (JSON)
    let args_json = CliArgs::try_parse_from([
        "oxy",
        "--json",
        "report",
        "--from",
        "2026-01-01",
        "--to",
        "2026-01-02",
        "--tz",
        "UTC",
    ])
    .unwrap();
    let result_json = handle_cli(args_json, &persistence, &engine);

    // Then (JSON)
    assert!(result_json.is_ok());
    let CliOutput::Json(json_str) = result_json.unwrap() else {
        panic!("expected json output");
    };
    let tree: ReportTreeDto = serde_json::from_str(&json_str).expect("valid ReportTreeDto");
    assert_eq!(tree.period, "Custom Range, UTC");
    assert_eq!(tree.total_seconds, 0);
    assert_eq!(tree.total_formatted, "00m 00s");
    assert_eq!(tree.projects.len(), 0);
    assert_eq!(tree.entries.len(), 0);
}
