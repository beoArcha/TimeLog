use crate::common::AppError;
use crate::engine::Engine;
use crate::types::TimerRepositoryState;
use crate::AppState;
use tauri::State;

#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PartialTimerRepositoryState {
    pub projects: Option<Vec<crate::types::Project>>,
    pub tasks: Option<Vec<crate::types::Task>>,
    pub logs: Option<Vec<crate::types::TimeLog>>,
    pub active_log: Option<Option<crate::types::TimeLog>>,
}

#[tauri::command]
pub fn get_state(state: State<'_, AppState>) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn override_state(
    state: PartialTimerRepositoryState,
    app_state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    app_state
        .persistence
        .core
        .override_state(state.projects, state.tasks, state.logs)?;
    let engine = Engine::new(&app_state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn reset(state: State<'_, AppState>) -> Result<TimerRepositoryState, AppError> {
    state.persistence.core.clear_all_data()?;
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}
