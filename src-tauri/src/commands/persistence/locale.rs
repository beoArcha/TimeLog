use crate::common::AppError;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_locale_pref(state: State<'_, AppState>) -> Result<String, AppError> {
    Ok(state.persistence.locale.get_locale_pref()?)
}

#[tauri::command]
pub fn save_locale_pref(pref: String, state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.locale.save_locale_pref(pref)?;
    Ok(())
}

#[tauri::command]
pub fn get_locale(state: State<'_, AppState>) -> Result<String, AppError> {
    Ok(state.persistence.locale.get_locale()?)
}

#[tauri::command]
pub fn save_locale(locale: String, state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.locale.save_locale(locale.clone())?;
    let parsed_locale = crate::types::Locale::from_sys_lang(&locale);
    let _ = crate::tray::menu::update_tray_menu_locale(&state, parsed_locale);
    Ok(())
}

#[tauri::command]
pub fn get_custom_translations(state: State<'_, AppState>) -> Result<String, AppError> {
    Ok(state.persistence.locale.get_custom_translations()?)
}

#[tauri::command]
pub fn save_custom_translations(
    translations: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state
        .persistence
        .locale
        .save_custom_translations(translations)?;
    Ok(())
}
