use oxy_flow::common::constants::DEFAULT_DB_NAME;
use oxy_flow::common::paths::{get_default_csv_dir, get_default_db_path, try_get_default_db_path};
use std::path::Path;

#[test]
fn test_try_get_default_db_path_succeeds_and_creates_dir() {
    // Arrange & Act
    let path_res = try_get_default_db_path();

    // Assert
    assert!(path_res.is_ok(), "try_get_default_db_path should succeed");
    let path = path_res.unwrap();
    assert!(
        path.parent().unwrap().exists(),
        "Enclosing database directory must exist"
    );
    assert_eq!(
        path.file_name().unwrap(),
        DEFAULT_DB_NAME,
        "Database filename must match DEFAULT_DB_NAME"
    );
}

#[test]
fn test_get_default_db_path_returns_same_as_try_get() {
    // Arrange & Act
    let path = get_default_db_path();

    // Assert
    assert_eq!(path.file_name().unwrap(), DEFAULT_DB_NAME);
}

#[test]
fn test_get_default_csv_dir_resolves_child_folder() {
    // Arrange
    let db_path = Path::new("C:/test_dir/sub/db.sqlite");

    // Act
    let csv_dir = get_default_csv_dir(db_path);

    // Assert
    assert_eq!(csv_dir, Path::new("C:/test_dir/sub/csv"));
}
