use crate::common::AppError;
use crate::types::PatchLog;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_patches(state: State<'_, AppState>) -> Result<Vec<PatchLog>, AppError> {
    Ok(state.persistence.patches.get_all()?)
}

#[tauri::command]
pub fn save_patches(patches: Vec<PatchLog>, state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.patches.save(patches)?;
    Ok(())
}
