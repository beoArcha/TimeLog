use oxy_flow::repositories::shared::initialize_database;
use rusqlite::Connection;
use std::path::PathBuf;

pub struct TestDb {
    pub conn: Connection,
}

impl TestDb {
    pub fn new() -> Self {
        let conn = Connection::open_in_memory().expect("in-memory DB open failed");
        let _ = conn.pragma_update(None, "journal_mode", "WAL");
        let _ = conn.pragma_update(None, "foreign_keys", "ON");
        initialize_database(&conn).expect("initialize_database failed");
        Self { conn }
    }

    pub fn with_project(self, id: &str, name: &str, color: &str) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn
            .execute(
                "INSERT INTO projects (id, name, color, created_at) VALUES (?, ?, ?, ?)",
                [id, name, color, &now],
            )
            .expect("insert project failed");
        self
    }

    pub fn with_task(self, id: &str, project_id: &str, name: &str) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn
            .execute(
                "INSERT INTO tasks (id, project_id, name, created_at) VALUES (?, ?, ?, ?)",
                [id, project_id, name, &now],
            )
            .expect("insert task failed");
        self
    }

    #[allow(dead_code)]
    pub fn with_running_timer(self, task_id: &str) -> Self {
        oxy_flow::services::timer_service::start(&self.conn, task_id).expect("start timer failed");
        self
    }
}

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
    let conn = Connection::open(&db_path).expect("open shared memdb failed");
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
