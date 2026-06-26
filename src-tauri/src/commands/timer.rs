use crate::common::AppError;
use crate::engine::Engine;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn start_timer(task_id: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let engine = Engine::new(&state.persistence);
    engine.start_timer(&task_id)?;
    Ok(())
}

#[tauri::command]
pub fn stop_timer(project_id: Option<String>, state: State<'_, AppState>) -> Result<(), AppError> {
    let engine = Engine::new(&state.persistence);
    engine.stop_timer(project_id.as_deref())?;
    Ok(())
}

#[tauri::command]
pub fn get_active_logs(state: State<'_, AppState>) -> Result<Vec<String>, AppError> {
    let engine = Engine::new(&state.persistence);
    let logs = engine.get_active_logs()?;
    Ok(logs)
}

#[tauri::command]
pub fn get_timer_state(
    state: State<'_, AppState>,
) -> Result<crate::types::TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn add_project(
    name: String,
    color: String,
    state: State<'_, AppState>,
) -> Result<crate::types::TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    engine.add_project(name, color)?;
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn toggle_project_archive(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<crate::types::TimerRepositoryState, AppError> {
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
) -> Result<crate::types::TimerRepositoryState, AppError> {
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
) -> Result<crate::types::TimerRepositoryState, AppError> {
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
) -> Result<crate::types::TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    engine.rename_task(task_id, name)?;
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn delete_task(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<crate::types::TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    engine.delete_task(task_id)?;
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn toggle_task_complete(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<crate::types::TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    engine.toggle_task_complete(task_id)?;
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn reset_database(
    state: State<'_, AppState>,
) -> Result<crate::types::TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    engine.reset_database()?;
    let current_state = engine.get_state()?;
    Ok(current_state)
}
