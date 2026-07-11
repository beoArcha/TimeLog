use crate::common::AppError;
use crate::types::Settings;
use crate::AppState;
use tauri::State;

#[tauri::command(rename = "get_settings")]
pub fn get(state: State<'_, AppState>) -> Result<Settings, AppError> {
    let settings = state.persistence.settings.get()?;
    Ok(settings)
}

#[tauri::command(rename = "save_settings")]
pub fn save(settings: Settings, state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.settings.save(settings)?;
    Ok(())
}
