use crate::common::AppError;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_current_project_id(state: State<'_, AppState>) -> Result<Option<String>, AppError> {
    Ok(state.persistence.ui_state.get_current_project_id()?)
}

#[tauri::command]
pub fn save_current_project_id(
    id: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.persistence.ui_state.save_current_project_id(id)?;
    Ok(())
}

#[tauri::command]
pub fn get_last_non_compact_variant(state: State<'_, AppState>) -> Result<String, AppError> {
    Ok(state.persistence.ui_state.get_last_non_compact_variant()?)
}

#[tauri::command]
pub fn save_last_non_compact_variant(
    variant: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state
        .persistence
        .ui_state
        .save_last_non_compact_variant(variant)?;
    Ok(())
}

#[tauri::command]
pub fn get_project_order(state: State<'_, AppState>) -> Result<Vec<String>, AppError> {
    Ok(state.persistence.ui_state.get_project_order()?)
}

#[tauri::command]
pub fn save_project_order(order: Vec<String>, state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.ui_state.save_project_order(order)?;
    Ok(())
}

#[tauri::command]
pub fn get_last_tracked_task_id(state: State<'_, AppState>) -> Result<Option<String>, AppError> {
    Ok(state.persistence.ui_state.get_last_tracked_task_id()?)
}

#[tauri::command]
pub fn save_last_tracked_task_id(
    id: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.persistence.ui_state.save_last_tracked_task_id(id)?;
    Ok(())
}
