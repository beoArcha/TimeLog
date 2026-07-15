use crate::common::AppError;
use crate::engine::Engine;
use crate::types::TimerRepositoryState;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_state(state: State<'_, AppState>) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn reset(state: State<'_, AppState>) -> Result<TimerRepositoryState, AppError> {
    state.persistence.core.clear_all_data()?;
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}
