use crate::common::AppError;
use crate::engine::Engine;
use crate::types::{Settings, TimerRepositoryState};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_timer_state(state: State<'_, AppState>) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn add_project(
    name: String,
    color: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    engine.add_project(name, color)?;
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn toggle_project_archive(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    engine.toggle_project_archive(project_id)?;
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn add_task(
    project_id: String,
    name: String,
    parent_task_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    engine.add_task(project_id, name, parent_task_id)?;
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn rename_project(
    project_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    engine.rename_project(project_id, name)?;
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn rename_task(
    task_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    engine.rename_task(task_id, name)?;
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn delete_task(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    engine.delete_task(task_id)?;
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn toggle_task_complete(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    engine.toggle_task_complete(task_id)?;
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn reset_database(state: State<'_, AppState>) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    engine.reset_database()?;
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<Settings, AppError> {
    let settings = state.persistence.get_config()?;
    Ok(settings)
}

#[tauri::command]
pub fn save_settings(settings: Settings, state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.save_config(settings)?;
    Ok(())
}
