use oxyflow_timelog::app::get_cli_db_path;
use oxyflow_timelog::common::constants::DEFAULT_DB_NAME;

#[test]
fn test_get_cli_db_path() {
    // Arrange: rely on system CLI default path resolver

    // Act
    let path = get_cli_db_path();

    // Assert
    assert!(path.to_string_lossy().contains(DEFAULT_DB_NAME));
}
