use tauri::{State, Window, AppHandle, Size, LogicalSize};
use crate::AppState;
use crate::errors::AppError;
use crate::engine::counting;

#[tauri::command]
pub fn start_timer(task_id: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let conn = state.db_conn.lock().map_err(|e| AppError::Generic(e.to_string()))?;
    counting::start_project_timer(&conn, &task_id)?;
    Ok(())
}

#[tauri::command]
pub fn stop_timer(project_id: Option<String>, state: State<'_, AppState>) -> Result<(), AppError> {
    let conn = state.db_conn.lock().map_err(|e| AppError::Generic(e.to_string()))?;
    counting::stop_project_timer(&conn, project_id.as_deref())?;
    Ok(())
}

#[tauri::command]
pub fn get_active_logs(state: State<'_, AppState>) -> Result<Vec<String>, AppError> {
    let conn = state.db_conn.lock().map_err(|e| AppError::Generic(e.to_string()))?;
    let active = counting::query_active_logs(&conn)?;
    Ok(active)
}

#[tauri::command]
pub fn resize_window(width: f64, height: f64, window: Window) -> Result<(), AppError> {
    window.set_size(Size::Logical(LogicalSize::new(width, height)))?;
    Ok(())
}

#[tauri::command]
pub fn set_always_on_top(always_on_top: bool, window: Window) -> Result<(), AppError> {
    window.set_always_on_top(always_on_top)?;
    Ok(())
}

#[tauri::command]
pub fn minimize_window(window: Window) -> Result<(), AppError> {
    window.minimize()?;
    Ok(())
}

#[tauri::command]
pub fn close_window(window: Window) -> Result<(), AppError> {
    window.close()?;
    Ok(())
}

#[tauri::command]
pub fn hide_window(window: Window) -> Result<(), AppError> {
    window.hide()?;
    Ok(())
}

#[tauri::command]
pub fn show_window(window: Window) -> Result<(), AppError> {
    window.show()?;
    window.set_focus()?;
    Ok(())
}

#[tauri::command]
pub fn set_window_resizable(resizable: bool, window: Window) -> Result<(), AppError> {
    window.set_resizable(resizable)?;
    Ok(())
}

#[tauri::command]
pub fn exit_app(app_handle: AppHandle) {
    app_handle.exit(0);
}
