use crate::shared::test_db::setup_persistence_test;
use oxyflow_timelog::common::errors::AppError;
use oxyflow_timelog::engine::{Engine, EngineError};
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::{AuditSource, TimeLogEditInput};

#[test]
fn test_engine_error_codes_mapping() {
    assert_eq!(
        EngineError::AuditReasonRequired.code(),
        "ERR_AUDIT_REASON_REQUIRED"
    );
    assert_eq!(
        EngineError::AuditSourceInvalid("InvalidSource".to_string()).code(),
        "ERR_AUDIT_SOURCE_INVALID"
    );
    assert_eq!(
        EngineError::TimeLogInvalidRange.code(),
        "ERR_TIMELOG_INVALID_RANGE"
    );
}

#[test]
fn test_app_error_ipc_payload_codes_parity() {
    let err_reason = AppError::Engine(EngineError::AuditReasonRequired);
    let payload_reason = err_reason.to_payload();
    assert_eq!(payload_reason.code, "ERR_AUDIT_REASON_REQUIRED");
    assert_eq!(
        payload_reason.message,
        "Audit reason is required for manual edits"
    );

    let err_source = AppError::Engine(EngineError::AuditSourceInvalid("BogusSource".to_string()));
    let payload_source = err_source.to_payload();
    assert_eq!(payload_source.code, "ERR_AUDIT_SOURCE_INVALID");
    assert!(payload_source.message.contains("BogusSource"));
    assert_eq!(payload_source.details.as_deref(), Some("BogusSource"));

    let err_range = AppError::Engine(EngineError::TimeLogInvalidRange);
    let payload_range = err_range.to_payload();
    assert_eq!(payload_range.code, "ERR_TIMELOG_INVALID_RANGE");
    assert_eq!(
        payload_range.message,
        "End time cannot be before start time"
    );
}

#[test]
fn test_audit_source_invalid_emits_typed_error() {
    let err = AuditSource::from_raw_str("UnsupportedSource").unwrap_err();
    assert_eq!(err.code(), "ERR_AUDIT_SOURCE_INVALID");
    assert!(matches!(err, EngineError::AuditSourceInvalid(_)));
}

#[test]
fn test_engine_edit_log_emits_typed_validation_codes() {
    let (conn, config, _temp_dir) = setup_persistence_test("engine_error_codes_parity");
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
        "INSERT INTO time_logs (id, task_id, start_time, end_time, note) VALUES ('log1', 't1', '2026-06-15T10:00:00Z', '2026-06-15T11:00:00Z', 'Initial note')",
        [],
    )
    .unwrap();

    // 1. Missing reason -> ERR_AUDIT_REASON_REQUIRED
    let err_no_reason = engine
        .edit_log(TimeLogEditInput {
            id: "log1",
            task_id: "t1",
            start_time: "2026-06-15T10:00:00Z",
            end_time: Some("2026-06-15T11:30:00Z"),
            note: Some("Updated note"),
            reason: None,
            audit_source: Some(AuditSource::GuiEdit),
        })
        .unwrap_err();

    assert_eq!(err_no_reason.code(), "ERR_AUDIT_REASON_REQUIRED");
    assert!(matches!(err_no_reason, EngineError::AuditReasonRequired));

    // 2. Invalid date range (end before start) -> ERR_TIMELOG_INVALID_RANGE
    let err_invalid_range = engine
        .edit_log(TimeLogEditInput {
            id: "log1",
            task_id: "t1",
            start_time: "2026-06-15T12:00:00Z",
            end_time: Some("2026-06-15T10:00:00Z"),
            note: Some("Updated note"),
            reason: Some("Valid reason"),
            audit_source: Some(AuditSource::GuiEdit),
        })
        .unwrap_err();

    assert_eq!(err_invalid_range.code(), "ERR_TIMELOG_INVALID_RANGE");
    assert!(matches!(
        err_invalid_range,
        EngineError::TimeLogInvalidRange
    ));
}
