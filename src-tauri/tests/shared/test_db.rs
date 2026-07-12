use oxy_flow::repositories::shared::initialize_database;
use rusqlite::Connection;
use std::path::PathBuf;

pub struct TempCsvDir {
    pub path: PathBuf,
}

impl Drop for TempCsvDir {
    fn drop(&mut self) {
        if self.path.exists() {
            let _ = std::fs::remove_dir_all(&self.path);
        }
    }
}

pub fn setup_persistence_test(
    db_name: &str,
) -> (
    Connection,
    oxy_flow::persistence::PersistenceConfig,
    TempCsvDir,
) {
    let db_path = PathBuf::from(format!("file:{}?mode=memory&cache=shared", db_name));
    let conn = Connection::open_with_flags(
        &db_path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_WRITE
            | rusqlite::OpenFlags::SQLITE_OPEN_CREATE
            | rusqlite::OpenFlags::SQLITE_OPEN_URI,
    ).expect("open shared memdb failed");
    let _ = conn.pragma_update(None, "journal_mode", "WAL");
    let _ = conn.pragma_update(None, "foreign_keys", "ON");
    initialize_database(&conn).expect("initialize_database failed");

    let csv_dir = std::env::current_dir()
        .unwrap()
        .join(format!("tests_csv_{}", db_name));
    if csv_dir.exists() {
        let _ = std::fs::remove_dir_all(&csv_dir);
    }
    std::fs::create_dir_all(&csv_dir).unwrap();

    let config = oxy_flow::persistence::PersistenceConfig {
        db_path,
        csv_directory: csv_dir.clone(),
    };

    (conn, config, TempCsvDir { path: csv_dir })
}
