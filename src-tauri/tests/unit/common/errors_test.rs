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

    // Assert
    assert_eq!(serialized, "\"Application error: test error\"");
    assert!(serialized_db.contains("Database error:"));
}

#[test]
fn test_app_error_conversions() {
    // Arrange
    let r_db = RepositoryError::Database(rusqlite::Error::QueryReturnedNoRows);
    let r_ser = RepositoryError::Serialization(serde_json::Error::io(std::io::Error::other("io")));
    let r_val = RepositoryError::Validation("invalid value".to_string());
    let e_db = PersistenceError::Database(rusqlite::Error::InvalidQuery);
    let e_val = "engine validation error".to_string();
    let e_parse = "invalid time".to_string();

    // Act
    let repo_db: AppError = r_db.into();
    let repo_ser: AppError = r_ser.into();
    let repo_val: AppError = r_val.into();
    let eng_db: AppError = EngineError::Persistence(e_db).into();
    let eng_val: AppError = EngineError::Validation(e_val).into();
    let eng_parse: AppError = EngineError::ParseTime(e_parse).into();
    let persist_db: AppError =
        PersistenceError::Database(rusqlite::Error::QueryReturnedNoRows).into();
    let persist_val: AppError =
        PersistenceError::Validation("persist validation".to_string()).into();

    let p_str: PersistenceError = "string error".to_string().into();
    let p_repo_ser: PersistenceError =
        RepositoryError::Serialization(serde_json::Error::io(std::io::Error::other("io"))).into();
    let p_repo_val: PersistenceError =
        RepositoryError::Validation("repo validation".to_string()).into();
    let p_repo_db: PersistenceError =
        RepositoryError::Database(rusqlite::Error::QueryReturnedNoRows).into();

    // Assert
    assert!(matches!(repo_db, AppError::Database(_)));
    assert!(matches!(repo_ser, AppError::Generic(_)));
    assert!(matches!(repo_val, AppError::Generic(_)));
    assert!(matches!(eng_db, AppError::Database(_)));
    assert!(matches!(eng_val, AppError::Generic(_)));
    assert!(matches!(eng_parse, AppError::Generic(_)));
    assert!(matches!(persist_db, AppError::Database(_)));
    assert!(matches!(persist_val, AppError::Generic(_)));
    assert!(matches!(p_str, PersistenceError::Validation(_)));
    assert!(matches!(p_repo_ser, PersistenceError::Validation(_)));
    assert!(matches!(p_repo_val, PersistenceError::Validation(_)));
    assert!(matches!(p_repo_db, PersistenceError::Database(_)));
}
