use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use chrono::Utc;
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::{AuditSource, TimeLogEditInput};

#[test]
fn test_validate_task_hierarchy_rejects_task_as_its_own_parent() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("engine_hierarchy_self");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_h")
        .with_name("HierarchyProj")
        .with_color("red")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_h1")
        .with_project_id("p_h")
        .with_name("Parent")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create(task).unwrap();

    // Act
    let result = engine.validate_task_hierarchy(Some("t_h1"), Some("t_h1"));

    // Assert
    assert!(result.is_err());
}

#[test]
fn test_validate_task_hierarchy_rejects_subtask_of_subtask() {
    // Arrange
    let (_conn, config, _temp_dir) = setup_persistence_test("engine_hierarchy_depth");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_h")
        .with_name("HierarchyProj")
        .with_color("red")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.projects.create(project).unwrap();

    let parent_task = TaskBuilder::new()
        .with_id("t_h1")
        .with_project_id("p_h")
        .with_name("Parent")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create(parent_task).unwrap();

    let subtask = TaskBuilder::new()
        .with_id("t_h2")
        .with_project_id("p_h")
        .with_parent("t_h1")
        .with_name("Subtask")
        .with_created_at(Utc::now().to_rfc3339())
        .build();
    persistence.tasks.create_subtask(subtask).unwrap();

    // Act
    let result = engine.validate_task_hierarchy(None, Some("t_h2"));

    // Assert
    assert!(result.is_err());
}

#[test]
fn test_engine_edit_log_with_all_fields() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_edit_log_all");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_edit")
        .with_name("EditProj")
        .with_color("purple")
        .with_created_at("2026-06-15T00:00:00Z")
        .build();
    persistence.projects.create(project).unwrap();

    let task1 = TaskBuilder::new()
        .with_id("t_edit_1")
        .with_project_id("p_edit")
        .with_name("EditTask1")
        .with_created_at("2026-06-15T00:00:00Z")
        .build();
    persistence.tasks.create(task1).unwrap();

    let task2 = TaskBuilder::new()
        .with_id("t_edit_2")
        .with_project_id("p_edit")
        .with_name("EditTask2")
        .with_created_at("2026-06-15T00:00:00Z")
        .build();
    persistence.tasks.create(task2).unwrap();

    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time, note) VALUES (?, ?, ?, ?, ?)",
        [
            "l_edit_1",
            "t_edit_1",
            "2026-06-15T08:00:00Z",
            "2026-06-15T09:00:00Z",
            "Old Note",
        ],
    )
    .unwrap();

    // Act
    engine
        .edit_log(TimeLogEditInput {
            id: "l_edit_1",
            task_id: "t_edit_2",
            start_time: "2026-06-15T08:15:00Z",
            end_time: Some("2026-06-15T09:15:00Z"),
            note: Some("New Note"),
            reason: Some("Corrected time and task"),
            audit_source: Some(AuditSource::ManualAdjustment),
        })
        .unwrap();

    // Assert
    let updated_log = persistence.time_logs.get_by_id("l_edit_1").unwrap();
    assert_eq!(updated_log.task_id, "t_edit_2");
    assert_eq!(updated_log.start_time, "2026-06-15T08:15:00Z");
    assert_eq!(
        updated_log.end_time.as_deref(),
        Some("2026-06-15T09:15:00Z")
    );
    assert_eq!(updated_log.note.as_deref(), Some("New Note"));
    let history = updated_log.edit_history.unwrap();
    assert_eq!(history.len(), 1);
    assert_eq!(
        history[0].reason.as_deref(),
        Some("Corrected time and task")
    );
    assert_eq!(
        history[0].audit_source.as_deref(),
        Some("Manual Adjustment")
    );
}

#[test]
fn test_engine_edit_log_manual_missing_or_empty_reason_fails_validation() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_edit_log_reason_validation");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    conn.execute(
        "INSERT INTO projects (id, name, color, created_at) VALUES ('p1', 'P1', 'blue', '2026-06-15T00:00:00Z')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t1', 'p1', 'T1', '2026-06-15T00:00:00Z')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time, note) VALUES ('log1', 't1', '2026-06-15T08:00:00Z', '2026-06-15T09:00:00Z', 'Note')",
        [],
    )
    .unwrap();

    // Act - GuiEdit with None reason
    let err_none = engine.edit_log(TimeLogEditInput {
        id: "log1",
        task_id: "t1",
        start_time: "2026-06-15T08:15:00Z",
        end_time: Some("2026-06-15T09:15:00Z"),
        note: None,
        reason: None,
        audit_source: Some(AuditSource::GuiEdit),
    });
    assert!(err_none.is_err());
    let err_msg = err_none.unwrap_err().to_string();
    assert!(
        err_msg.contains("Audit reason is required for manual edits"),
        "unexpected error message: {}",
        err_msg
    );

    // Act - ManualAdjustment with whitespace-only reason
    let err_empty = engine.edit_log(TimeLogEditInput {
        id: "log1",
        task_id: "t1",
        start_time: "2026-06-15T08:15:00Z",
        end_time: Some("2026-06-15T09:15:00Z"),
        note: None,
        reason: Some("   "),
        audit_source: Some(AuditSource::ManualAdjustment),
    });
    assert!(err_empty.is_err());
    let err_msg = err_empty.unwrap_err().to_string();
    assert!(
        err_msg.contains("Audit reason is required for manual edits"),
        "unexpected error message: {}",
        err_msg
    );
}

#[test]
fn test_engine_edit_log_cli_without_reason_fails_validation() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_edit_log_cli_no_reason");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    conn.execute(
        "INSERT INTO projects (id, name, color, created_at) VALUES ('p1', 'P1', 'blue', '2026-06-15T00:00:00Z')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t1', 'p1', 'T1', '2026-06-15T00:00:00Z')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time, note) VALUES ('log1', 't1', '2026-06-15T08:00:00Z', '2026-06-15T09:00:00Z', 'Note')",
        [],
    )
    .unwrap();

    // Act - CliEdit without reason must fail
    let res = engine.edit_log(TimeLogEditInput {
        id: "log1",
        task_id: "t1",
        start_time: "2026-06-15T08:15:00Z",
        end_time: Some("2026-06-15T09:15:00Z"),
        note: Some("Updated by CLI"),
        reason: None,
        audit_source: Some(AuditSource::CliEdit),
    });
    assert!(res.is_err());
    assert!(res
        .unwrap_err()
        .to_string()
        .contains("Audit reason is required for manual edits"));

    // Act - CliEdit with whitespace-only reason must fail
    let res_ws = engine.edit_log(TimeLogEditInput {
        id: "log1",
        task_id: "t1",
        start_time: "2026-06-15T08:15:00Z",
        end_time: Some("2026-06-15T09:15:00Z"),
        note: Some("Updated by CLI"),
        reason: Some("   "),
        audit_source: Some(AuditSource::CliEdit),
    });
    assert!(res_ws.is_err());
    assert!(res_ws
        .unwrap_err()
        .to_string()
        .contains("Audit reason is required for manual edits"));

    // Act - CliEdit with reason must succeed and trim reason
    let res_ok = engine.edit_log(TimeLogEditInput {
        id: "log1",
        task_id: "t1",
        start_time: "2026-06-15T08:15:00Z",
        end_time: Some("2026-06-15T09:15:00Z"),
        note: Some("Updated by CLI"),
        reason: Some("  CLI batch modification  "),
        audit_source: Some(AuditSource::CliEdit),
    });
    assert!(res_ok.is_ok());

    let updated_log = persistence.time_logs.get_by_id("log1").unwrap();
    let history = updated_log.edit_history.unwrap();
    assert_eq!(history.len(), 1);
    assert_eq!(history[0].reason.as_deref(), Some("CLI batch modification"));
    assert_eq!(history[0].audit_source.as_deref(), Some("CLI Edit"));
}

#[test]
fn test_engine_edit_log_system_patch_without_reason_succeeds() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_edit_log_system_patch");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    conn.execute(
        "INSERT INTO projects (id, name, color, created_at) VALUES ('p1', 'P1', 'blue', '2026-06-15T00:00:00Z')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t1', 'p1', 'T1', '2026-06-15T00:00:00Z')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time, note) VALUES ('log_patch', 't1', '2026-06-15T08:00:00Z', '2026-06-15T09:00:00Z', 'Note')",
        [],
    )
    .unwrap();

    // Act - SystemPatch without reason is the only exempt source
    let res = engine.edit_log(TimeLogEditInput {
        id: "log_patch",
        task_id: "t1",
        start_time: "2026-06-15T08:10:00Z",
        end_time: Some("2026-06-15T09:10:00Z"),
        note: Some("System patch note"),
        reason: None,
        audit_source: Some(AuditSource::SystemPatch),
    });
    assert!(res.is_ok());

    let updated_log = persistence.time_logs.get_by_id("log_patch").unwrap();
    let history = updated_log.edit_history.unwrap();
    assert_eq!(history.len(), 1);
    assert_eq!(history[0].reason, None);
    assert_eq!(history[0].audit_source.as_deref(), Some("System Patch"));

    // Act - SystemPatch with trimmed reason
    let res2 = engine.edit_log(TimeLogEditInput {
        id: "log_patch",
        task_id: "t1",
        start_time: "2026-06-15T08:20:00Z",
        end_time: Some("2026-06-15T09:20:00Z"),
        note: Some("System patch note 2"),
        reason: Some("  Auto maintenance sync  "),
        audit_source: Some(AuditSource::SystemPatch),
    });
    assert!(res2.is_ok());

    let updated_log2 = persistence.time_logs.get_by_id("log_patch").unwrap();
    let history2 = updated_log2.edit_history.unwrap();
    assert_eq!(history2.len(), 2);
    assert_eq!(history2[1].reason.as_deref(), Some("Auto maintenance sync"));
    assert_eq!(history2[1].audit_source.as_deref(), Some("System Patch"));
}

#[test]
fn test_engine_edit_log_missing_audit_source_defaults_to_gui_edit_and_requires_reason() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_edit_log_default_source");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    conn.execute(
        "INSERT INTO projects (id, name, color, created_at) VALUES ('p1', 'P1', 'blue', '2026-06-15T00:00:00Z')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t1', 'p1', 'T1', '2026-06-15T00:00:00Z')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time, note) VALUES ('log_def', 't1', '2026-06-15T08:00:00Z', '2026-06-15T09:00:00Z', 'Note')",
        [],
    )
    .unwrap();

    // Act - None audit_source without reason must fail
    let res_err = engine.edit_log(TimeLogEditInput {
        id: "log_def",
        task_id: "t1",
        start_time: "2026-06-15T08:05:00Z",
        end_time: Some("2026-06-15T09:05:00Z"),
        note: None,
        reason: None,
        audit_source: None,
    });
    assert!(res_err.is_err());
    assert!(res_err
        .unwrap_err()
        .to_string()
        .contains("Audit reason is required for manual edits"));

    // Act - None audit_source with reason succeeds and defaults to GUI Edit
    let res_ok = engine.edit_log(TimeLogEditInput {
        id: "log_def",
        task_id: "t1",
        start_time: "2026-06-15T08:05:00Z",
        end_time: Some("2026-06-15T09:05:00Z"),
        note: None,
        reason: Some("  Default GUI correction  "),
        audit_source: None,
    });
    assert!(res_ok.is_ok());

    let updated_log = persistence.time_logs.get_by_id("log_def").unwrap();
    let history = updated_log.edit_history.unwrap();
    assert_eq!(history.len(), 1);
    assert_eq!(history[0].reason.as_deref(), Some("Default GUI correction"));
    assert_eq!(history[0].audit_source.as_deref(), Some("GUI Edit"));
}

#[test]
fn test_audit_source_from_raw_str_unknown_fails_validation() {
    assert!(AuditSource::from_raw_str("UnknownSource").is_err());
    assert!(AuditSource::from_raw_str("").is_err());
    assert!("Invalid".parse::<AuditSource>().is_err());

    assert_eq!(
        AuditSource::from_raw_str("CLI Edit").unwrap(),
        AuditSource::CliEdit
    );
    assert_eq!(
        AuditSource::from_raw_str("CliEdit").unwrap(),
        AuditSource::CliEdit
    );
    assert_eq!(
        AuditSource::from_raw_str("GUI Edit").unwrap(),
        AuditSource::GuiEdit
    );
    assert_eq!(
        AuditSource::from_raw_str("GuiEdit").unwrap(),
        AuditSource::GuiEdit
    );
    assert_eq!(
        AuditSource::from_raw_str("System Patch").unwrap(),
        AuditSource::SystemPatch
    );
    assert_eq!(
        AuditSource::from_raw_str("SystemPatch").unwrap(),
        AuditSource::SystemPatch
    );
    assert_eq!(
        AuditSource::from_raw_str("Manual Adjustment").unwrap(),
        AuditSource::ManualAdjustment
    );
    assert_eq!(
        AuditSource::from_raw_str("ManualAdjustment").unwrap(),
        AuditSource::ManualAdjustment
    );
}

#[test]
fn test_engine_edit_log_generates_unique_uuid_history_ids() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_edit_log_uuid_history");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    conn.execute(
        "INSERT INTO projects (id, name, color, created_at) VALUES ('p1', 'P1', 'teal', '2026-06-15T00:00:00Z')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t1', 'p1', 'T1', '2026-06-15T00:00:00Z')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time, note) VALUES ('log_uuid', 't1', '2026-06-15T08:00:00Z', '2026-06-15T09:00:00Z', 'Note')",
        [],
    )
    .unwrap();

    // Act - perform two consecutive edits
    engine
        .edit_log(TimeLogEditInput {
            id: "log_uuid",
            task_id: "t1",
            start_time: "2026-06-15T08:00:00Z",
            end_time: Some("2026-06-15T09:05:00Z"),
            note: Some("Edit 1"),
            reason: Some("First adjustment"),
            audit_source: Some(AuditSource::ManualAdjustment),
        })
        .unwrap();

    engine
        .edit_log(TimeLogEditInput {
            id: "log_uuid",
            task_id: "t1",
            start_time: "2026-06-15T08:00:00Z",
            end_time: Some("2026-06-15T09:10:00Z"),
            note: Some("Edit 2"),
            reason: Some("Second adjustment"),
            audit_source: Some(AuditSource::GuiEdit),
        })
        .unwrap();

    // Assert
    let rows: Vec<(String, Option<String>)> = {
        let mut stmt = conn
            .prepare("SELECT id, prev_start_time FROM time_logs_history WHERE time_log_id = ? ORDER BY edited_at ASC")
            .unwrap();
        let iter = stmt
            .query_map(["log_uuid"], |r| Ok((r.get(0)?, r.get(1)?)))
            .unwrap();
        iter.map(|r| r.unwrap()).collect()
    };

    assert_eq!(rows.len(), 2);
    let (id1, prev_start1) = &rows[0];
    let (id2, _prev_start2) = &rows[1];

    assert_ne!(id1, id2, "History IDs must be unique across rapid edits");
    assert!(id1.starts_with("history_"));
    assert!(id2.starts_with("history_"));

    let uuid_part1 = id1.trim_start_matches("history_");
    let uuid_part2 = id2.trim_start_matches("history_");
    assert!(uuid::Uuid::parse_str(uuid_part1).is_ok());
    assert!(uuid::Uuid::parse_str(uuid_part2).is_ok());

    // start_time was not modified in either edit
    assert_eq!(*prev_start1, None);
}

#[test]
fn test_engine_edit_log_prev_start_recorded_when_start_time_changes() {
    // Arrange
    let (conn, config, _temp_dir) = setup_persistence_test("engine_edit_log_prev_start");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    conn.execute(
        "INSERT INTO projects (id, name, color, created_at) VALUES ('p1', 'P1', 'teal', '2026-06-15T00:00:00Z')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t1', 'p1', 'T1', '2026-06-15T00:00:00Z')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time, note) VALUES ('log_start', 't1', '2026-06-15T08:00:00Z', '2026-06-15T09:00:00Z', 'Note')",
        [],
    )
    .unwrap();

    // Act - edit with modified start_time
    engine
        .edit_log(TimeLogEditInput {
            id: "log_start",
            task_id: "t1",
            start_time: "2026-06-15T08:30:00Z",
            end_time: Some("2026-06-15T09:00:00Z"),
            note: Some("Shifted start"),
            reason: Some("Delayed start correction"),
            audit_source: Some(AuditSource::ManualAdjustment),
        })
        .unwrap();

    // Assert
    let prev_start: Option<String> = conn
        .query_row(
            "SELECT prev_start_time FROM time_logs_history WHERE time_log_id = ?",
            ["log_start"],
            |r| r.get(0),
        )
        .unwrap();

    assert_eq!(prev_start.as_deref(), Some("2026-06-15T08:00:00Z"));
}
