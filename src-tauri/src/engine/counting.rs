use crate::engine::constants;
use chrono::Utc;
use rusqlite::{params, Connection, Result};

pub fn start_project_timer(conn: &Connection, task_id: &str) -> Result<()> {
    let mut stmt = conn.prepare(constants::SELECT_PROJECT_ID_BY_TASK_ID)?;
    let proj_id: String = stmt.query_row(params![task_id], |row| row.get(0))?;

    conn.execute(
        constants::CLOSE_ACTIVE_LOGS_BY_PROJECT,
        params![Utc::now().to_rfc3339(), proj_id],
    )?;

    static LOG_COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
    let log_id = format!(
        "log_{}_{}",
        Utc::now().timestamp_millis(),
        LOG_COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst)
    );
    conn.execute(
        constants::INSERT_TIME_LOG,
        params![log_id, task_id, Utc::now().to_rfc3339()],
    )?;

    Ok(())
}

pub fn stop_project_timer(conn: &Connection, project_id: Option<&str>) -> Result<()> {
    let now = Utc::now().to_rfc3339();
    match project_id {
        Some(p_id) => {
            conn.execute(constants::CLOSE_ACTIVE_LOGS_BY_PROJECT, params![now, p_id])?;
        }
        None => {
            conn.execute(constants::CLOSE_ALL_ACTIVE_LOGS, params![now])?;
        }
    }
    Ok(())
}

pub fn query_active_logs(conn: &Connection) -> Result<Vec<String>> {
    let mut stmt = conn.prepare(constants::SELECT_ACTIVE_TASK_IDS)?;
    let rows = stmt.query_map([], |row| row.get::<_, String>(0))?;
    let mut ids = Vec::new();
    for id_res in rows {
        ids.push(id_res?);
    }
    Ok(ids)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::test_helpers::TestDb;

    #[test]
    fn test_counting_lifecycle() -> Result<()> {
        let conn = TestDb::new()
            .with_project("p1", "Proj1", "red")
            .with_task("t1", "p1", "Task1")
            .with_task("t2", "p1", "Task2")
            .conn;

        let active = query_active_logs(&conn)?;
        assert_eq!(active.len(), 0);

        start_project_timer(&conn, "t1")?;
        let active = query_active_logs(&conn)?;
        assert_eq!(active.len(), 1);
        assert_eq!(active[0], "t1");

        start_project_timer(&conn, "t2")?;
        let active2 = query_active_logs(&conn)?;
        assert_eq!(active2.len(), 1);
        assert_eq!(active2[0], "t2");

        stop_project_timer(&conn, Some("p1"))?;
        let active3 = query_active_logs(&conn)?;
        assert_eq!(active3.len(), 0);

        Ok(())
    }

    #[test]
    fn test_cross_project_concurrency() -> Result<()> {
        let conn = TestDb::new()
            .with_project("p1", "Proj1", "red")
            .with_task("t1", "p1", "Task1")
            .with_task("t1_b", "p1", "Task1B")
            .with_project("p2", "Proj2", "blue")
            .with_task("t2", "p2", "Task2")
            .conn;

        start_project_timer(&conn, "t1")?;
        start_project_timer(&conn, "t2")?;

        let active = query_active_logs(&conn)?;
        assert_eq!(active.len(), 2, "Both projects should run concurrently");
        assert!(active.contains(&"t1".to_string()));
        assert!(active.contains(&"t2".to_string()));

        start_project_timer(&conn, "t1_b")?;
        let active2 = query_active_logs(&conn)?;
        assert_eq!(active2.len(), 2);
        assert!(active2.contains(&"t1_b".to_string()));
        assert!(active2.contains(&"t2".to_string()));

        // Stop all
        stop_project_timer(&conn, None)?;
        let active3 = query_active_logs(&conn)?;
        assert_eq!(active3.len(), 0);

        Ok(())
    }

    #[test]
    fn test_start_timer_nonexistent_task_fails() -> Result<()> {
        let conn = TestDb::new().conn;
        let res = start_project_timer(&conn, "999");
        assert!(res.is_err());
        Ok(())
    }

    #[test]
    fn test_stop_timer_no_active_logs() -> Result<()> {
        let conn = TestDb::new().conn;
        let res = stop_project_timer(&conn, None);
        assert!(res.is_ok());
        Ok(())
    }

    #[test]
    fn test_stop_timer_invalid_project() -> Result<()> {
        let conn = TestDb::new()
            .with_project("p1", "Proj1", "red")
            .with_task("t1", "p1", "Task1")
            .conn;

        start_project_timer(&conn, "t1")?;

        let res = stop_project_timer(&conn, Some("nonexistent_project"));
        assert!(res.is_ok());

        let active = query_active_logs(&conn)?;
        assert_eq!(active.len(), 1);
        assert_eq!(active[0], "t1");
        Ok(())
    }
}
