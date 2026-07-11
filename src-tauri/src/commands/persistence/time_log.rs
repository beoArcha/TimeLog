use crate::common::AppError;
use crate::types::TimeLog;
use crate::AppState;
use tauri::State;

#[tauri::command(rename = "get_time_logs_for_task")]
pub fn get_for_task(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<TimeLog>, AppError> {
    Ok(state.persistence.time_logs.get_for_task(&task_id)?)
}

#[tauri::command(rename = "close_active_logs_by_project")]
pub fn close_active_by_project(
    end_time: String,
    project_id: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.persistence.time_logs.close_active_by_project(&end_time, &project_id)?;
    Ok(())
}

#[tauri::command(rename = "close_all_active_logs")]
pub fn close_all_active(
    end_time: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.persistence.time_logs.close_all_active(&end_time)?;
    Ok(())
}

#[tauri::command(rename = "insert_time_log")]
pub fn insert(
    log_id: String,
    task_id: String,
    start_time: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.persistence.time_logs.insert(&log_id, &task_id, &start_time)?;
    Ok(())
}

#[tauri::command(rename = "query_active_logs")]
pub fn query_active(
    state: State<'_, AppState>,
) -> Result<Vec<String>, AppError> {
    Ok(state.persistence.time_logs.query_active()?)
}

#[tauri::command(rename = "get_all_time_logs")]
pub fn get_all(
    state: State<'_, AppState>,
) -> Result<Vec<TimeLog>, AppError> {
    Ok(state.persistence.time_logs.get_all()?)
}
