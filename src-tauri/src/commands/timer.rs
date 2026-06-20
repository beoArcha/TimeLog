use crate::errors::AppError;
use crate::services::timer_service;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn start_timer(task_id: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let conn = state
        .db_conn
        .lock()
        .map_err(|e| AppError::Generic(e.to_string()))?;
    timer_service::start(&conn, &task_id)
}

#[tauri::command]
pub fn stop_timer(project_id: Option<String>, state: State<'_, AppState>) -> Result<(), AppError> {
    let conn = state
        .db_conn
        .lock()
        .map_err(|e| AppError::Generic(e.to_string()))?;
    timer_service::stop(&conn, project_id.as_deref())
}

#[tauri::command]
pub fn get_active_logs(state: State<'_, AppState>) -> Result<Vec<String>, AppError> {
    let conn = state
        .db_conn
        .lock()
        .map_err(|e| AppError::Generic(e.to_string()))?;
    timer_service::get_active(&conn)
}
