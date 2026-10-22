use crate::common::AppError;
use crate::repositories::business::debug::TableRowsResponse;
use crate::AppState;
use tauri::State;

#[cfg(debug_assertions)]
#[tauri::command]
pub fn debug_get_tables(state: State<'_, AppState>) -> Result<Vec<String>, AppError> {
    let tables = state.persistence.debug.get_tables()?;
    Ok(tables)
}

#[cfg(not(debug_assertions))]
#[tauri::command]
pub fn debug_get_tables() -> Result<Vec<String>, AppError> {
    Err(AppError::Generic(
        "Debug database commands are strictly disabled in production builds".into(),
    ))
}

#[cfg(debug_assertions)]
#[tauri::command]
pub fn debug_get_table_rows(
    table: String,
    limit: u32,
    offset: u32,
    state: State<'_, AppState>,
) -> Result<TableRowsResponse, AppError> {
    let response = state
        .persistence
        .debug
        .get_table_rows(&table, limit, offset)?;
    Ok(response)
}

#[cfg(not(debug_assertions))]
#[tauri::command]
pub fn debug_get_table_rows(
    _table: String,
    _limit: u32,
    _offset: u32,
) -> Result<TableRowsResponse, AppError> {
    Err(AppError::Generic(
        "Debug database commands are strictly disabled in production builds".into(),
    ))
}

#[cfg(debug_assertions)]
#[tauri::command]
pub fn debug_update_cell(
    table: String,
    id_column: String,
    id_value: String,
    column: String,
    new_value: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state
        .persistence
        .debug
        .update_cell(&table, &id_column, &id_value, &column, &new_value)?;
    Ok(())
}

#[cfg(not(debug_assertions))]
#[tauri::command]
pub fn debug_update_cell(
    _table: String,
    _id_column: String,
    _id_value: String,
    _column: String,
    _new_value: String,
) -> Result<(), AppError> {
    Err(AppError::Generic(
        "Debug database commands are strictly disabled in production builds".into(),
    ))
}
