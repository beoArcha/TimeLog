use crate::common::AppError;
use crate::engine::Engine;
use crate::types::ElapsedRangeFilter;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_task_elapsed(
    task_id: String,
    _now_iso: Option<String>,
    state: State<'_, AppState>,
) -> Result<u64, AppError> {
    let engine = Engine::new(&state.persistence);
    let duration = engine.calculate_task_elapsed(&task_id)?;
    Ok(duration.as_secs())
}

#[tauri::command]
pub fn get_project_elapsed(
    project_id: String,
    _now_iso: Option<String>,
    state: State<'_, AppState>,
) -> Result<u64, AppError> {
    let engine = Engine::new(&state.persistence);
    let duration = engine.calculate_project_elapsed(&project_id)?;
    Ok(duration.as_secs())
}

#[tauri::command]
pub fn get_elapsed_range(
    range: ElapsedRangeFilter,
    _now_iso: Option<String>,
    state: State<'_, AppState>,
) -> Result<u64, AppError> {
    let engine = Engine::new(&state.persistence);
    let duration = engine.calculate_elapsed_range(&range)?;
    Ok(duration.as_secs())
}
