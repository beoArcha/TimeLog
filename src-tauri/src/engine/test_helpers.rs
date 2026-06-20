use crate::engine::db::init_db_in_memory;
use rusqlite::Connection;

pub struct TestDb {
    pub conn: Connection,
}

impl TestDb {
    pub fn new() -> Self {
        let conn = init_db_in_memory().expect("in-memory DB init failed");
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
        crate::engine::counting::start_project_timer(&self.conn, task_id)
            .expect("start timer failed");
        self
    }
}
