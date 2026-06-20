use crate::engine::counting;
use crate::errors::AppError;
use crate::types::{GuiSize, TextAndIconSize};
use crate::AppState;
use tauri::{AppHandle, LogicalSize, Size, State, Window};

#[tauri::command]
pub fn start_timer(task_id: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let conn = state
        .db_conn
        .lock()
        .map_err(|e| AppError::Generic(e.to_string()))?;
    counting::start_project_timer(&conn, &task_id)?;
    Ok(())
}

#[tauri::command]
pub fn stop_timer(project_id: Option<String>, state: State<'_, AppState>) -> Result<(), AppError> {
    let conn = state
        .db_conn
        .lock()
        .map_err(|e| AppError::Generic(e.to_string()))?;
    counting::stop_project_timer(&conn, project_id.as_deref())?;
    Ok(())
}

#[tauri::command]
pub fn get_active_logs(state: State<'_, AppState>) -> Result<Vec<String>, AppError> {
    let conn = state
        .db_conn
        .lock()
        .map_err(|e| AppError::Generic(e.to_string()))?;
    let active = counting::query_active_logs(&conn)?;
    Ok(active)
}

#[tauri::command]
pub fn resize_window(width: f64, height: f64, window: Window) -> Result<(), AppError> {
    window.set_size(Size::Logical(LogicalSize::new(width, height)))?;
    Ok(())
}

#[tauri::command]
pub fn set_gui_size(
    size: GuiSize,
    text_and_icon_size: TextAndIconSize,
    window: Window,
) -> Result<(), AppError> {
    let (width, height, resizable) = match size {
        GuiSize::Small => (320.0, 480.0, false),
        GuiSize::Medium => match text_and_icon_size {
            TextAndIconSize::Small => (380.0, 580.0, true),
            TextAndIconSize::Medium => (400.0, 600.0, true),
            TextAndIconSize::Large => (450.0, 650.0, true),
        },
        GuiSize::Large => match text_and_icon_size {
            TextAndIconSize::Small => (750.0, 550.0, true),
            TextAndIconSize::Medium => (800.0, 600.0, true),
            TextAndIconSize::Large => (900.0, 700.0, true),
        },
    };
    window.set_resizable(resizable)?;
    window.set_size(Size::Logical(LogicalSize::new(width, height)))?;
    Ok(())
}

#[tauri::command]
pub fn set_always_on_top(always_on_top: bool, window: Window) -> Result<(), AppError> {
    window.set_always_on_top(always_on_top)?;
    Ok(())
}

#[tauri::command]
pub fn minimize_window(window: Window) -> Result<(), AppError> {
    window.minimize()?;
    Ok(())
}

#[tauri::command]
pub fn close_window(window: Window) -> Result<(), AppError> {
    window.close()?;
    Ok(())
}

#[tauri::command]
pub fn hide_window(window: Window) -> Result<(), AppError> {
    window.hide()?;
    Ok(())
}

#[tauri::command]
pub fn show_window(window: Window) -> Result<(), AppError> {
    window.show()?;
    window.set_focus()?;
    Ok(())
}

#[tauri::command]
pub fn set_window_resizable(resizable: bool, window: Window) -> Result<(), AppError> {
    window.set_resizable(resizable)?;
    Ok(())
}

#[tauri::command]
pub fn exit_app(app_handle: AppHandle) {
    app_handle.exit(0);
}

#[tauri::command]
pub fn set_minimize_to_tray(minimize: bool, state: State<'_, AppState>) {
    state
        .minimize_to_tray
        .store(minimize, std::sync::atomic::Ordering::Relaxed);
}
