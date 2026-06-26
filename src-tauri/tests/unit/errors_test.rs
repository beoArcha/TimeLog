use oxy_flow::common::errors::AppError;

#[test]
fn test_app_error_serialization() {
    let err = AppError::Generic("test error".to_string());
    let serialized = serde_json::to_string(&err).unwrap();
    assert_eq!(serialized, "\"Application error: test error\"");

    let db_err = AppError::Database(rusqlite::Error::QueryReturnedNoRows);
    let serialized_db = serde_json::to_string(&db_err).unwrap();
    assert!(serialized_db.contains("Database error:"));
}
