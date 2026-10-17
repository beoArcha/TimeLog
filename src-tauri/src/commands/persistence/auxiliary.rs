use crate::common::AppError;
use crate::types::ExternalApiSettings;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_current_project_id(state: State<'_, AppState>) -> Result<Option<String>, AppError> {
    Ok(state.persistence.auxiliary.get_current_project_id()?)
}

#[tauri::command]
pub fn save_current_project_id(
    id: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.persistence.auxiliary.save_current_project_id(id)?;
    Ok(())
}

#[tauri::command]
pub fn get_last_non_compact_variant(state: State<'_, AppState>) -> Result<String, AppError> {
    Ok(state.persistence.auxiliary.get_last_non_compact_variant()?)
}

#[tauri::command]
pub fn save_last_non_compact_variant(
    variant: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state
        .persistence
        .auxiliary
        .save_last_non_compact_variant(variant)?;
    Ok(())
}

#[tauri::command]
pub fn get_external_api_settings(
    state: State<'_, AppState>,
) -> Result<ExternalApiSettings, AppError> {
    Ok(state.persistence.auxiliary.get_external_api_settings()?)
}

#[tauri::command]
pub fn save_external_api_settings(
    settings: ExternalApiSettings,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state
        .persistence
        .auxiliary
        .save_external_api_settings(settings)?;
    Ok(())
}

#[tauri::command]
pub fn get_locale_pref(state: State<'_, AppState>) -> Result<String, AppError> {
    Ok(state.persistence.auxiliary.get_locale_pref()?)
}

#[tauri::command]
pub fn save_locale_pref(pref: String, state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.auxiliary.save_locale_pref(pref)?;
    Ok(())
}

#[tauri::command]
pub fn get_locale(state: State<'_, AppState>) -> Result<String, AppError> {
    Ok(state.persistence.auxiliary.get_locale()?)
}

#[tauri::command]
pub fn save_locale(locale: String, state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.auxiliary.save_locale(locale)?;
    Ok(())
}

#[tauri::command]
pub fn get_custom_translations(state: State<'_, AppState>) -> Result<String, AppError> {
    Ok(state.persistence.auxiliary.get_custom_translations()?)
}

#[tauri::command]
pub fn save_custom_translations(
    translations: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state
        .persistence
        .auxiliary
        .save_custom_translations(translations)?;
    Ok(())
}
