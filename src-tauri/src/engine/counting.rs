//! High-frequency time tracking aggregation routines
use rusqlite::{Connection, Result, params};
use chrono::Utc;

/// Automatically wraps running timer logs and targets cross-project parallel tracking
pub fn start_project_timer(conn: &Connection, task_id: &str) -> Result<()> {
    // 1. Get project ID bound to task
    let mut stmt = conn.prepare("SELECT project_id FROM tasks WHERE id = ? LIMIT 1")?;
    let proj_id: String = stmt.query_row(params![task_id], |row| row.get(0))?;

    // 2. Stop executing timers inside this project (exclusive within project, yet parallel across other projects)
    conn.execute(
        "UPDATE time_logs 
         SET end_time = ? 
         WHERE end_time IS NULL 
         AND task_id IN (SELECT id FROM tasks WHERE project_id = ?)",
        params![Utc::now().to_rfc3339(), proj_id]
    )?;

    // 3. Start registering new task timer
    static LOG_COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
    let log_id = format!("log_{}_{}", Utc::now().timestamp_millis(), LOG_COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst));
    conn.execute(
        "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, NULL)",
        params![log_id, task_id, Utc::now().to_rfc3339()]
    )?;

    Ok(())
}

/// Ends pending time logs for a given project identifier (or stop all if None)
pub fn stop_project_timer(conn: &Connection, project_id: Option<&str>) -> Result<()> {
    let now = Utc::now().to_rfc3339();
    match project_id {
        Some(p_id) => {
            conn.execute(
                "UPDATE time_logs 
                 SET end_time = ? 
                 WHERE end_time IS NULL 
                 AND task_id IN (SELECT id FROM tasks WHERE project_id = ?)",
                params![now, p_id]
            )?;
        }
        None => {
            conn.execute("UPDATE time_logs SET end_time = ? WHERE end_time IS NULL", params![now])?;
        }
    }
    Ok(())
}

/// Gathers list of currently actively tracking logs
pub fn query_active_logs(conn: &Connection) -> Result<Vec<String>> {
    let mut stmt = conn.prepare("SELECT task_id FROM time_logs WHERE end_time IS NULL")?;
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
    use crate::engine::db::init_db_in_memory;

    #[test]
    fn test_counting_lifecycle() -> Result<()> {
        let conn = init_db_in_memory()?;
        let now = chrono::Utc::now().to_rfc3339();
        
        // Setup initial project and tasks
        conn.execute("INSERT INTO projects (id, name, color, created_at) VALUES ('p1', 'Proj1', 'red', ?)", [&now])?;
        conn.execute("INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t1', 'p1', 'Task1', ?)", [&now])?;
        conn.execute("INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t2', 'p1', 'Task2', ?)", [&now])?;

        // 1. Initial State
        let active = query_active_logs(&conn)?;
        assert_eq!(active.len(), 0);

        // 2. Start Task 1
        start_project_timer(&conn, "t1")?;
        let active = query_active_logs(&conn)?;
        assert_eq!(active.len(), 1);
        assert_eq!(active[0], "t1");

        // 3. Start Task 2 (same project, so Task 1 should stop)
        start_project_timer(&conn, "t2")?;
        let active2 = query_active_logs(&conn)?;
        assert_eq!(active2.len(), 1);
        assert_eq!(active2[0], "t2");

        // 4. Stop specific project timer
        stop_project_timer(&conn, Some("p1"))?;
        let active3 = query_active_logs(&conn)?;
        assert_eq!(active3.len(), 0);

        Ok(())
    }

    #[test]
    fn test_cross_project_concurrency() -> Result<()> {
        let conn = init_db_in_memory()?;
        let now = chrono::Utc::now().to_rfc3339();
        
        // Setup two projects
        conn.execute("INSERT INTO projects (id, name, color, created_at) VALUES ('p1', 'Proj1', 'red', ?)", [&now])?;
        conn.execute("INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t1', 'p1', 'Task1', ?)", [&now])?;
        conn.execute("INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t1_b', 'p1', 'Task1B', ?)", [&now])?;
        
        conn.execute("INSERT INTO projects (id, name, color, created_at) VALUES ('p2', 'Proj2', 'blue', ?)", [&now])?;
        conn.execute("INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t2', 'p2', 'Task2', ?)", [&now])?;

        // Start t1 in p1
        start_project_timer(&conn, "t1")?;
        
        // Start t2 in p2
        start_project_timer(&conn, "t2")?;
        
        let active = query_active_logs(&conn)?;
        assert_eq!(active.len(), 2, "Both projects should run concurrently");
        assert!(active.contains(&"t1".to_string()));
        assert!(active.contains(&"t2".to_string()));

        // Start t1_b in p1 (should stop t1 but leave t2 running)
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
        let conn = init_db_in_memory()?;
        let res = start_project_timer(&conn, "999");
        assert!(res.is_err());
        Ok(())
    }

    #[test]
    fn test_stop_timer_no_active_logs() -> Result<()> {
        let conn = init_db_in_memory()?;
        let res = stop_project_timer(&conn, None);
        assert!(res.is_ok());
        Ok(())
    }

    #[test]
    fn test_stop_timer_invalid_project() -> Result<()> {
        let conn = init_db_in_memory()?;
        let now = chrono::Utc::now().to_rfc3339();
        
        conn.execute("INSERT INTO projects (id, name, color, created_at) VALUES ('p1', 'Proj1', 'red', ?)", [&now])?;
        conn.execute("INSERT INTO tasks (id, project_id, name, created_at) VALUES ('t1', 'p1', 'Task1', ?)", [&now])?;
        
        start_project_timer(&conn, "t1")?;
        
        let res = stop_project_timer(&conn, Some("nonexistent_project"));
        assert!(res.is_ok());
        
        let active = query_active_logs(&conn)?;
        assert_eq!(active.len(), 1);
        assert_eq!(active[0], "t1");
        Ok(())
    }
}
