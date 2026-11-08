mod shared;

use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::{AuditSource, TimeLogEditInput};
use rusqlite::Connection;
use serde::Deserialize;
use shared::builders::{ProjectBuilder, TaskBuilder};
use shared::test_db::setup_persistence_test;

#[derive(Debug, Deserialize)]
struct AuditParityCase {
    id: String,
    description: String,
    #[serde(rename = "auditSource")]
    audit_source: Option<String>,
    reason: Option<String>,
    #[serde(rename = "expectedSuccess")]
    expected_success: bool,
    #[serde(rename = "expectedErrorCode")]
    expected_error_code: Option<String>,
    #[serde(rename = "expectedAuditSource")]
    expected_audit_source: Option<String>,
    #[serde(rename = "expectedReason")]
    expected_reason: Option<String>,
}

fn seed_persistence_with_log(
    db_name: &str,
) -> (Persistence, Connection, shared::test_db::TempCsvDir) {
    let (conn, config, temp_dir) = setup_persistence_test(db_name);
    let persistence = Persistence::new(&config).expect("failed to setup persistence");

    let project = ProjectBuilder::new()
        .with_id("p_parity")
        .with_name("Parity Project")
        .with_color("blue")
        .build();
    persistence.projects.create(project).unwrap();

    let task = TaskBuilder::new()
        .with_id("t_parity")
        .with_project_id("p_parity")
        .with_name("Parity Task")
        .build();
    persistence.tasks.create(task).unwrap();

    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time, note) VALUES (?, ?, ?, ?, ?)",
        [
            "log-parity",
            "t_parity",
            "2026-06-15T10:00:00Z",
            "2026-06-15T11:00:00Z",
            "Original note",
        ],
    )
    .unwrap();

    (persistence, conn, temp_dir)
}

#[test]
fn test_given_shared_audit_parity_matrix_when_executed_in_rust_then_satisfies_cross_runtime_parity()
{
    // Given
    let fixture_str = include_str!("../../tests/shared/fixtures/audit-parity-cases.json");
    let cases: Vec<AuditParityCase> =
        serde_json::from_str(fixture_str).expect("Failed to parse audit-parity-cases.json");

    for case in cases {
        let db_name = format!("parity_{}", case.id.replace('-', "_"));
        let (persistence, _conn, _temp) = seed_persistence_with_log(&db_name);
        let engine = Engine::new(&persistence);

        // When
        let parsed_source_res = match case.audit_source.as_deref() {
            Some(s) if !s.trim().is_empty() => AuditSource::from_raw_str(s),
            _ => Ok(AuditSource::GuiEdit),
        };

        // Then
        match parsed_source_res {
            Err(err) => {
                assert!(
                    !case.expected_success,
                    "Case {} expected success but audit source parsing failed",
                    case.id
                );
                assert_eq!(
                    Some(err.code()),
                    case.expected_error_code.as_deref(),
                    "Case {} error code mismatch on audit source parse: {:?}",
                    case.id,
                    case.description
                );
            }
            Ok(parsed_source) => {
                let actual_source = match case.audit_source {
                    Some(_) => Some(parsed_source),
                    None => None,
                };

                let edit_result = engine.edit_log(TimeLogEditInput {
                    id: "log-parity",
                    task_id: "t_parity",
                    start_time: "2026-06-15T10:00:00Z",
                    end_time: Some("2026-06-15T11:30:00Z"),
                    note: Some("Updated note"),
                    reason: case.reason.as_deref(),
                    audit_source: actual_source,
                });

                if case.expected_success {
                    assert!(
                        edit_result.is_ok(),
                        "Case {} expected success but got error: {:?}",
                        case.id,
                        edit_result.err()
                    );

                    let updated_log = persistence.time_logs.get_by_id("log-parity").unwrap();
                    let history = updated_log
                        .edit_history
                        .expect("editHistory should be present on successful edit");
                    assert_eq!(
                        history.len(),
                        1,
                        "Case {} expected 1 history entry",
                        case.id
                    );

                    assert_eq!(
                        history[0].audit_source.as_deref(),
                        case.expected_audit_source.as_deref(),
                        "Case {} audit_source mismatch",
                        case.id
                    );

                    assert_eq!(
                        history[0].reason.as_deref(),
                        case.expected_reason.as_deref(),
                        "Case {} reason mismatch",
                        case.id
                    );
                } else {
                    assert!(
                        edit_result.is_err(),
                        "Case {} expected failure but succeeded",
                        case.id
                    );
                    let err = edit_result.unwrap_err();
                    assert_eq!(
                        Some(err.code()),
                        case.expected_error_code.as_deref(),
                        "Case {} expected error code {:?}, got {:?}",
                        case.id,
                        case.expected_error_code,
                        err.code()
                    );
                }
            }
        }
    }
}

#[test]
fn test_given_missing_audit_source_when_edited_with_valid_reason_then_defaults_to_gui_edit() {
    // Given
    let (persistence, _conn, _temp) = seed_persistence_with_log("audit_default_valid");
    let engine = Engine::new(&persistence);

    // When
    let result = engine.edit_log(TimeLogEditInput {
        id: "log-parity",
        task_id: "t_parity",
        start_time: "2026-06-15T10:00:00Z",
        end_time: Some("2026-06-15T11:15:00Z"),
        note: Some("Note"),
        reason: Some("  Correction via GUI  "),
        audit_source: None,
    });

    // Then
    assert!(result.is_ok());
    let updated = persistence.time_logs.get_by_id("log-parity").unwrap();
    let history = updated.edit_history.unwrap();
    assert_eq!(history.len(), 1);
    assert_eq!(history[0].audit_source.as_deref(), Some("GUI Edit"));
    assert_eq!(history[0].reason.as_deref(), Some("Correction via GUI"));
}

#[test]
fn test_given_manual_source_when_reason_is_missing_or_whitespace_then_fails_with_reason_required() {
    // Given
    let (persistence, _conn, _temp) = seed_persistence_with_log("audit_manual_no_reason");
    let engine = Engine::new(&persistence);

    // When (None reason)
    let err_none = engine.edit_log(TimeLogEditInput {
        id: "log-parity",
        task_id: "t_parity",
        start_time: "2026-06-15T10:00:00Z",
        end_time: Some("2026-06-15T11:15:00Z"),
        note: None,
        reason: None,
        audit_source: Some(AuditSource::GuiEdit),
    });

    // Then
    assert!(err_none.is_err());
    assert_eq!(err_none.unwrap_err().code(), "ERR_AUDIT_REASON_REQUIRED");

    // When (Whitespace reason)
    let err_ws = engine.edit_log(TimeLogEditInput {
        id: "log-parity",
        task_id: "t_parity",
        start_time: "2026-06-15T10:00:00Z",
        end_time: Some("2026-06-15T11:15:00Z"),
        note: None,
        reason: Some("   "),
        audit_source: Some(AuditSource::ManualAdjustment),
    });

    // Then
    assert!(err_ws.is_err());
    assert_eq!(err_ws.unwrap_err().code(), "ERR_AUDIT_REASON_REQUIRED");
}

#[test]
fn test_given_system_patch_when_reason_is_missing_then_succeeds_without_reason() {
    // Given
    let (persistence, _conn, _temp) = seed_persistence_with_log("audit_sys_patch_no_reason");
    let engine = Engine::new(&persistence);

    // When
    let result = engine.edit_log(TimeLogEditInput {
        id: "log-parity",
        task_id: "t_parity",
        start_time: "2026-06-15T10:00:00Z",
        end_time: Some("2026-06-15T11:15:00Z"),
        note: Some("SysPatch"),
        reason: None,
        audit_source: Some(AuditSource::SystemPatch),
    });

    // Then
    assert!(result.is_ok());
    let updated = persistence.time_logs.get_by_id("log-parity").unwrap();
    let history = updated.edit_history.unwrap();
    assert_eq!(history.len(), 1);
    assert_eq!(history[0].audit_source.as_deref(), Some("System Patch"));
    assert_eq!(history[0].reason, None);
}

#[test]
fn test_given_invalid_audit_source_when_parsed_then_fails_with_source_invalid() {
    // Given
    let invalid_raw = "InvalidSource";
    let unknown_raw = "Unknown";

    // When
    let res_invalid = AuditSource::from_raw_str(invalid_raw);
    let res_unknown = AuditSource::from_raw_str(unknown_raw);

    // Then
    assert!(res_invalid.is_err());
    assert_eq!(res_invalid.unwrap_err().code(), "ERR_AUDIT_SOURCE_INVALID");

    assert!(res_unknown.is_err());
    assert_eq!(res_unknown.unwrap_err().code(), "ERR_AUDIT_SOURCE_INVALID");
}
