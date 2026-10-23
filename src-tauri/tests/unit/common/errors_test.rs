use oxy_flow::common::errors::AppError;
use oxy_flow::engine::EngineError;
use oxy_flow::persistence::PersistenceError;
use oxy_flow::repositories::shared::errors::RepositoryError;

#[test]
fn test_app_error_serialization() {
    // Arrange
    let err = AppError::Generic("test error".to_string());
    let db_err = AppError::Database(rusqlite::Error::QueryReturnedNoRows);

    // Act
    let serialized = serde_json::to_string(&err).unwrap();
    let serialized_db = serde_json::to_string(&db_err).unwrap();
    let payload: oxy_flow::types::IpcErrorPayload = serde_json::from_str(&serialized).unwrap();
    let payload_db: oxy_flow::types::IpcErrorPayload =
        serde_json::from_str(&serialized_db).unwrap();

    // Assert
    assert_eq!(payload.code, "GEN_APPLICATION_ERROR");
    assert_eq!(payload.message, "test error");
    assert_eq!(payload_db.code, "STO_SQLITE_ERROR");
    assert!(payload_db.message.contains("Query returned no rows"));
    assert_eq!(payload_db.details.as_deref(), Some("QueryReturnedNoRows"));
}

#[test]
fn test_app_error_conversions() {
    // Arrange
    let r_db = RepositoryError::Database(rusqlite::Error::QueryReturnedNoRows);
    let r_ser = RepositoryError::Serialization(serde_json::Error::io(std::io::Error::other("io")));
    let r_not_found = RepositoryError::NotFound {
        entity: "Task",
        id: "task-123".to_string(),
    };
    let r_val = RepositoryError::Validation("invalid value".to_string());
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

    // Act
    let repo_db: AppError = r_db.into();
    let repo_ser: AppError = r_ser.into();
    let repo_not_found: AppError = r_not_found.into();
    let repo_val: AppError = r_val.into();
    let eng_db: AppError = EngineError::Persistence(e_db).into();
    let eng_val: AppError = EngineError::Validation(e_val).into();
    let eng_parse: AppError = EngineError::ParseTime(e_parse).into();
    let eng_not_found: AppError = e_not_found.into();
    let eng_no_active: AppError = e_no_active.into();
    let eng_conflict: AppError = e_conflict.into();
    let persist_db: AppError =
        PersistenceError::Database(rusqlite::Error::QueryReturnedNoRows).into();
    let persist_val: AppError =
        PersistenceError::Validation("persist validation".to_string()).into();

    let p_repo_ser: PersistenceError =
        RepositoryError::Serialization(serde_json::Error::io(std::io::Error::other("io"))).into();
    let p_repo_not_found: PersistenceError = RepositoryError::NotFound {
        entity: "Project",
        id: "p1".to_string(),
    }
    .into();
    let p_repo_val: PersistenceError =
        RepositoryError::Validation("repo validation".to_string()).into();
    let p_repo_db: PersistenceError =
        RepositoryError::Database(rusqlite::Error::QueryReturnedNoRows).into();

    // Assert
    assert!(matches!(
        repo_db,
        AppError::Persistence(PersistenceError::Database(_))
    ));
    assert!(matches!(
        repo_ser,
        AppError::Persistence(PersistenceError::Serialization(_))
    ));
    assert!(matches!(
        repo_not_found,
        AppError::Persistence(PersistenceError::NotFound { .. })
    ));
    assert!(matches!(
        repo_val,
        AppError::Persistence(PersistenceError::Validation(_))
    ));
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
        persist_db,
        AppError::Persistence(PersistenceError::Database(_))
    ));
    assert!(matches!(
        persist_val,
        AppError::Persistence(PersistenceError::Validation(_))
    ));
    assert!(matches!(p_repo_ser, PersistenceError::Serialization(_)));
    assert!(matches!(
        p_repo_not_found,
        PersistenceError::NotFound {
            entity: "Project",
            ..
        }
    ));
    assert!(matches!(p_repo_val, PersistenceError::Validation(_)));
    assert!(matches!(p_repo_db, PersistenceError::Database(_)));
}
