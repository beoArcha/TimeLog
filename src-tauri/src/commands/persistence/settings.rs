use crate::common::AppError;
use crate::types::{Settings, RuntimeConfig};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get(state: State<'_, AppState>) -> Result<Settings, AppError> {
    let settings = state.persistence.settings.get()?;
    Ok(settings)
}

#[tauri::command]
pub fn save(settings: Settings, state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.settings.save(settings)?;
    Ok(())
}

#[tauri::command]
pub fn get_runtime_configs(state: State<'_, AppState>) -> Result<Vec<RuntimeConfig>, AppError> {
    let configs = state.persistence.settings.get_runtime_configs()?;
    Ok(configs)
}

#[tauri::command]
pub fn save_runtime_config(config: RuntimeConfig, state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.settings.save_runtime_config(config)?;
    Ok(())
}

