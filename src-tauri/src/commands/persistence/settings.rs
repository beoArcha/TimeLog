use crate::common::AppError;
use crate::types::Settings;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<Settings, AppError> {
    let settings = state.persistence.settings.get_settings()?;
    Ok(settings)
}

#[tauri::command]
pub fn save_settings(settings: Settings, state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.settings.save_settings(settings)?;
    Ok(())
}
