use oxy_flow::common::errors::AppError;
use oxy_flow::engine::EngineError;
use oxy_flow::persistence::PersistenceError;
use oxy_flow::repositories::shared::errors::RepositoryError;

#[test]
fn test_app_error_serialization() {
    let err = AppError::Generic("test error".to_string());
    let serialized = serde_json::to_string(&err).unwrap();
    assert_eq!(serialized, "\"Application error: test error\"");

    let db_err = AppError::Database(rusqlite::Error::QueryReturnedNoRows);
    let serialized_db = serde_json::to_string(&db_err).unwrap();
    assert!(serialized_db.contains("Database error:"));
}

#[test]
fn test_app_error_conversions() {
    let repo_db: AppError = RepositoryError::Database(rusqlite::Error::QueryReturnedNoRows).into();
    assert!(matches!(repo_db, AppError::Database(_)));

    let repo_ser: AppError = RepositoryError::Serialization(serde_json::Error::io(
        std::io::Error::new(std::io::ErrorKind::Other, "io"),
    ))
    .into();
    assert!(matches!(repo_ser, AppError::Generic(_)));

    let repo_val: AppError = RepositoryError::Validation("invalid value".to_string()).into();
    assert!(matches!(repo_val, AppError::Generic(_)));

    let eng_db: AppError =
        EngineError::Persistence(PersistenceError::Database(rusqlite::Error::InvalidQuery)).into();
    assert!(matches!(eng_db, AppError::Database(_)));

    let eng_val: AppError = EngineError::Validation("engine validation error".to_string()).into();
    assert!(matches!(eng_val, AppError::Generic(_)));

    let eng_parse: AppError = EngineError::ParseTime("invalid time".to_string()).into();
    assert!(matches!(eng_parse, AppError::Generic(_)));

    let persist_db: AppError =
        PersistenceError::Database(rusqlite::Error::QueryReturnedNoRows).into();
    assert!(matches!(persist_db, AppError::Database(_)));

    let persist_val: AppError =
        PersistenceError::Validation("persist validation".to_string()).into();
    assert!(matches!(persist_val, AppError::Generic(_)));

    let p_str: PersistenceError = "string error".to_string().into();
    assert!(matches!(p_str, PersistenceError::Validation(_)));

    let p_repo_ser: PersistenceError = RepositoryError::Serialization(serde_json::Error::io(
        std::io::Error::new(std::io::ErrorKind::Other, "io"),
    ))
    .into();
    assert!(matches!(p_repo_ser, PersistenceError::Validation(_)));

    let p_repo_val: PersistenceError =
        RepositoryError::Validation("repo validation".to_string()).into();
    assert!(matches!(p_repo_val, PersistenceError::Validation(_)));

    let p_repo_db: PersistenceError =
        RepositoryError::Database(rusqlite::Error::QueryReturnedNoRows).into();
    assert!(matches!(p_repo_db, PersistenceError::Database(_)));
}
