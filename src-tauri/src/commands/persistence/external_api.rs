use crate::common::AppError;
use crate::types::ExternalApiSettings;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_external_api_settings(
    state: State<'_, AppState>,
) -> Result<ExternalApiSettings, AppError> {
    Ok(state.persistence.external_api.get_external_api_settings()?)
}

#[tauri::command]
pub fn save_external_api_settings(
    settings: ExternalApiSettings,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state
        .persistence
        .external_api
        .save_external_api_settings(settings)?;
    Ok(())
}
