use crate::common::AppError;
use crate::types::HolidayLeave;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_holidays(state: State<'_, AppState>) -> Result<Vec<HolidayLeave>, AppError> {
    Ok(state.persistence.holidays.get_all()?)
}

#[tauri::command]
pub fn save_holidays(
    holidays: Vec<HolidayLeave>,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.persistence.holidays.save(holidays)?;
    Ok(())
}
