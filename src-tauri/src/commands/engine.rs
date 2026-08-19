use crate::common::AppError;
use crate::engine::Engine;
use crate::types::{ElapsedRangeFilter, ProjectStatistics};
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
pub fn resume_timer(task_id: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let engine = Engine::new(&state.persistence);
    engine.start_timer(&task_id)?;
    Ok(())
}

#[tauri::command]
pub fn get_active_logs(state: State<'_, AppState>) -> Result<Vec<String>, AppError> {
    let engine = Engine::new(&state.persistence);
    let logs = engine.get_active_logs()?;
    Ok(logs)
}

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

#[tauri::command]
pub fn edit_time_log(
    id: String,
    task_id: String,
    start_time: String,
    end_time: Option<String>,
    note: Option<String>,
    reason: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    let engine = Engine::new(&state.persistence);
    engine.edit_log(
        &id,
        &task_id,
        &start_time,
        end_time.as_deref(),
        note.as_deref(),
        reason.as_deref(),
    )?;
    Ok(())
}

#[tauri::command]
pub fn get_project_statistics(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<ProjectStatistics, AppError> {
    let engine = Engine::new(&state.persistence);
    let stats = engine.get_project_statistics(&project_id)?;
    Ok(stats)
}
