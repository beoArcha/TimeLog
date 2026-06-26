use oxy_flow::app::get_cli_db_path;
use oxy_flow::common::constants::DEFAULT_DB_NAME;

#[test]
fn test_get_cli_db_path() {
    let path = get_cli_db_path();
    assert!(path.to_string_lossy().contains(DEFAULT_DB_NAME));
}
