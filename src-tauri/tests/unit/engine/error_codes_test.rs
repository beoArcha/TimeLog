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
    assert_eq!(
        EngineError::TaskAlreadyCompleted("t1".to_string()).code(),
        "ERR_TASK_ALREADY_COMPLETED"
    );
    assert_eq!(
        EngineError::InvalidTimezone("Mars/Olympus".to_string()).code(),
        "DOM_INVALID_TIMEZONE"
    );
    assert_eq!(
        EngineError::InvalidRangeInput("bad".to_string()).code(),
        "DOM_INVALID_RANGE_INPUT"
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

    let err_completed = AppError::Engine(EngineError::TaskAlreadyCompleted("t_done_1".to_string()));
    let payload_completed = err_completed.to_payload();
    assert_eq!(payload_completed.code, "ERR_TASK_ALREADY_COMPLETED");
    assert!(payload_completed.message.contains("t_done_1"));
    assert_eq!(payload_completed.details.as_deref(), Some("t_done_1"));
}

#[test]
fn test_app_error_ipc_payload_carries_range_error_details() {
    let err_tz = AppError::Engine(EngineError::InvalidTimezone("Mars/Olympus".to_string()));
    let payload_tz = err_tz.to_payload();
    assert_eq!(payload_tz.code, "DOM_INVALID_TIMEZONE");
    assert!(payload_tz.message.contains("Mars/Olympus"));
    assert_eq!(payload_tz.details.as_deref(), Some("Mars/Olympus"));

    let err_range = AppError::Engine(EngineError::InvalidRangeInput("bad".to_string()));
    let payload_range = err_range.to_payload();
    assert_eq!(payload_range.code, "DOM_INVALID_RANGE_INPUT");
    assert_eq!(payload_range.details.as_deref(), Some("bad"));
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

#[test]
fn test_start_and_switch_timer_rejects_completed_task() {
    let (conn, config, _temp_dir) = setup_persistence_test("engine_timer_completed_task");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    conn.execute(
        "INSERT INTO projects (id, name, color, created_at) VALUES ('p1', 'P1', 'blue', '2026-06-15T00:00:00Z')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO tasks (id, project_id, name, completed, created_at) VALUES ('t_done', 'p1', 'Completed Task', 1, '2026-06-15T00:00:00Z')",
        [],
    )
    .unwrap();

    let err_start = engine.start_timer("t_done").unwrap_err();
    assert_eq!(err_start.code(), "ERR_TASK_ALREADY_COMPLETED");
    assert!(matches!(
        err_start,
        EngineError::TaskAlreadyCompleted(ref id) if id == "t_done"
    ));

    let err_switch = engine.switch_timer("t_done").unwrap_err();
    assert_eq!(err_switch.code(), "ERR_TASK_ALREADY_COMPLETED");
    assert!(matches!(
        err_switch,
        EngineError::TaskAlreadyCompleted(ref id) if id == "t_done"
    ));
}

#[test]
fn test_amount_out_of_range_reports_the_business_violation_code() {
    // Arrange
    let limit = 9_007_199_254_740_991;

    // Act
    let code = EngineError::AmountOutOfRange { limit }.code();
    let payload = AppError::Engine(EngineError::AmountOutOfRange { limit }).to_payload();

    // Assert
    assert_eq!(code, "DOM_BUSINESS_VIOLATION");
    assert_eq!(payload.code, "DOM_BUSINESS_VIOLATION");
}
