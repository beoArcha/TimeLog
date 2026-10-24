use oxy_flow::common::errors::AppError;
use oxy_flow::engine::EngineError;
use oxy_flow::persistence::PersistenceError;
use oxy_flow::repositories::shared::errors::RepositoryError;

#[test]
fn test_app_error_serialization() {
    // Arrange
    let err = AppError::Generic("test error".to_string());
    let db_err = AppError::Database(rusqlite::Error::QueryReturnedNoRows);
    let constraint_err = AppError::Persistence(PersistenceError::ConstraintViolation(
        "UNIQUE constraint failed".to_string(),
    ));
    let parse_time_err = AppError::Engine(EngineError::ParseTime("invalid timestamp".to_string()));
    let not_found_err = AppError::Persistence(PersistenceError::NotFound {
        entity: "Task",
        id: "task-42".to_string(),
    });

    // Act
    let serialized = serde_json::to_string(&err).unwrap();
    let serialized_db = serde_json::to_string(&db_err).unwrap();
    let serialized_constraint = serde_json::to_string(&constraint_err).unwrap();
    let serialized_parse_time = serde_json::to_string(&parse_time_err).unwrap();
    let serialized_not_found = serde_json::to_string(&not_found_err).unwrap();

    let payload: oxy_flow::types::IpcErrorPayload = serde_json::from_str(&serialized).unwrap();
    let payload_db: oxy_flow::types::IpcErrorPayload =
        serde_json::from_str(&serialized_db).unwrap();
    let payload_constraint: oxy_flow::types::IpcErrorPayload =
        serde_json::from_str(&serialized_constraint).unwrap();
    let payload_parse_time: oxy_flow::types::IpcErrorPayload =
        serde_json::from_str(&serialized_parse_time).unwrap();
    let payload_not_found: oxy_flow::types::IpcErrorPayload =
        serde_json::from_str(&serialized_not_found).unwrap();

    // Assert
    assert_eq!(payload.code, "GEN_APPLICATION_ERROR");
    assert_eq!(payload.message, "test error");
    assert_eq!(payload_db.code, "STO_SQLITE_ERROR");
    assert!(payload_db.message.contains("Query returned no rows"));
    assert_eq!(payload_db.details.as_deref(), Some("QueryReturnedNoRows"));
    assert_eq!(payload_constraint.code, "STO_SQLITE_CONSTRAINT");
    assert_eq!(
        payload_constraint.details.as_deref(),
        Some("UNIQUE constraint failed")
    );
    assert_eq!(payload_parse_time.code, "DOM_INVALID_TIMESTAMP");
    assert_eq!(
        payload_parse_time.details.as_deref(),
        Some("invalid timestamp")
    );
    assert_eq!(payload_not_found.code, "DOM_ENTITY_NOT_FOUND");
    assert_eq!(
        payload_not_found.details.as_deref(),
        Some("entity=Task, id=task-42")
    );
}

#[test]
fn test_app_error_conversions() {
    // Arrange
    let e_db = PersistenceError::Database(rusqlite::Error::InvalidQuery);
    let e_val = "engine validation error".to_string();
    let e_parse = "invalid time".to_string();
    let e_not_found = EngineError::EntityNotFound {
        entity: "Task",
        id: "task-123".to_string(),
    };
    let e_no_active = EngineError::NoActiveTimer;
    let e_conflict = EngineError::ActiveTimerConflict {
        active_task_id: "task-999".to_string(),
    };
    let e_op_failed = EngineError::OperationFailed("internal failure".to_string());

    // Act
    let eng_db: AppError = EngineError::Persistence(e_db).into();
    let eng_val: AppError = EngineError::Validation(e_val).into();
    let eng_parse: AppError = EngineError::ParseTime(e_parse).into();
    let eng_not_found: AppError = e_not_found.into();
    let eng_no_active: AppError = e_no_active.into();
    let eng_conflict: AppError = e_conflict.into();
    let eng_op_failed: AppError = e_op_failed.into();
    let persist_db: AppError =
        PersistenceError::Database(rusqlite::Error::QueryReturnedNoRows).into();
    let persist_val: AppError =
        PersistenceError::Validation("persist validation".to_string()).into();
    let persist_constraint: AppError =
        PersistenceError::ConstraintViolation("constraint violation".to_string()).into();

    // Assert
    assert!(matches!(
        eng_db,
        AppError::Engine(EngineError::Persistence(_))
    ));
    assert!(matches!(
        eng_val,
        AppError::Engine(EngineError::Validation(_))
    ));
    assert!(matches!(
        eng_parse,
        AppError::Engine(EngineError::ParseTime(_))
    ));
    assert!(matches!(
        eng_not_found,
        AppError::Engine(EngineError::EntityNotFound { .. })
    ));
    assert!(matches!(
        eng_no_active,
        AppError::Engine(EngineError::NoActiveTimer)
    ));
    assert!(matches!(
        eng_conflict,
        AppError::Engine(EngineError::ActiveTimerConflict { .. })
    ));
    assert!(matches!(
        eng_op_failed,
        AppError::Engine(EngineError::OperationFailed(_))
    ));
    assert!(matches!(
        persist_db,
        AppError::Persistence(PersistenceError::Database(_))
    ));
    assert!(matches!(
        persist_val,
        AppError::Persistence(PersistenceError::Validation(_))
    ));
    assert!(matches!(
        persist_constraint,
        AppError::Persistence(PersistenceError::ConstraintViolation(_))
    ));
}

#[test]
fn test_repository_error_to_persistence_error_conversions() {
    // Arrange
    let r_db = RepositoryError::Database(rusqlite::Error::QueryReturnedNoRows);
    let r_ser = RepositoryError::Serialization(serde_json::Error::io(std::io::Error::other("io")));
    let r_not_found = RepositoryError::NotFound {
        entity: "Project",
        id: "p1".to_string(),
    };
    let r_val = RepositoryError::Validation("repo validation".to_string());
    let r_constraint = RepositoryError::ConstraintViolation("unique name".to_string());

    // Act
    let p_db: PersistenceError = r_db.into();
    let p_ser: PersistenceError = r_ser.into();
    let p_not_found: PersistenceError = r_not_found.into();
    let p_val: PersistenceError = r_val.into();
    let p_constraint: PersistenceError = r_constraint.into();

    // Assert
    assert!(matches!(p_db, PersistenceError::Database(_)));
    assert!(matches!(p_ser, PersistenceError::Serialization(_)));
    assert!(matches!(
        p_not_found,
        PersistenceError::NotFound {
            entity: "Project",
            ..
        }
    ));
    assert!(matches!(p_val, PersistenceError::Validation(_)));
    assert!(matches!(
        p_constraint,
        PersistenceError::ConstraintViolation(_)
    ));
}
