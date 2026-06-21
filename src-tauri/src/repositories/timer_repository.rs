use crate::engine::constants;
use rusqlite::{params, Connection, Result};

pub fn get_project_id_by_task_id(conn: &Connection, task_id: &str) -> Result<String> {
    let mut stmt = conn.prepare(constants::SELECT_PROJECT_ID_BY_TASK_ID)?;
    stmt.query_row(params![task_id], |row| row.get(0))
}

pub fn close_active_logs_by_project(
    conn: &Connection,
    end_time: &str,
    project_id: &str,
) -> Result<usize> {
    conn.execute(
        constants::CLOSE_ACTIVE_LOGS_BY_PROJECT,
        params![end_time, project_id],
    )
}

pub fn close_all_active_logs(conn: &Connection, end_time: &str) -> Result<usize> {
    conn.execute(constants::CLOSE_ALL_ACTIVE_LOGS, params![end_time])
}

pub fn insert_time_log(
    conn: &Connection,
    log_id: &str,
    task_id: &str,
    start_time: &str,
) -> Result<usize> {
    conn.execute(
        constants::INSERT_TIME_LOG,
        params![log_id, task_id, start_time],
    )
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
