use crate::common::AppError;
use crate::repositories::timer_repository;
use chrono::Utc;
use rusqlite::Connection;

static LOG_COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);

pub fn start(conn: &Connection, task_id: &str) -> Result<(), AppError> {
    let proj_id = timer_repository::get_project_id_by_task_id(conn, task_id)?;

    let now = Utc::now().to_rfc3339();
    timer_repository::close_active_logs_by_project(conn, &now, &proj_id)?;

    let log_id = format!(
        "log_{}_{}",
        Utc::now().timestamp_millis(),
        LOG_COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst)
    );

    timer_repository::insert_time_log(conn, &log_id, task_id, &now)?;
    Ok(())
}

pub fn stop(conn: &Connection, project_id: Option<&str>) -> Result<(), AppError> {
    let now = Utc::now().to_rfc3339();
    match project_id {
        Some(p_id) => {
            timer_repository::close_active_logs_by_project(conn, &now, p_id)?;
        }
        None => {
            timer_repository::close_all_active_logs(conn, &now)?;
        }
    }
    Ok(())
}

pub fn get_active(conn: &Connection) -> Result<Vec<String>, AppError> {
    let ids = timer_repository::query_active_logs(conn)?;
    Ok(ids)
}
