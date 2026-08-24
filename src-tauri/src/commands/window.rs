use crate::app::state::AppState;
use crate::common::AppError;
use crate::types::{LayoutVariant, TextAndIconSize};
use tauri::{LogicalSize, Size, State, Window};

#[tauri::command]
pub fn resize(width: f64, height: f64, window: Window) -> Result<(), AppError> {
    window.set_size(Size::Logical(LogicalSize::new(width, height)))?;
    Ok(())
}

#[tauri::command]
pub fn set_layout_variant(
    variant: LayoutVariant,
    text_and_icon_size: TextAndIconSize,
    window: Window,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    let (dims, resizable) = variant.get_dimensions(text_and_icon_size);
    window.set_resizable(resizable)?;
    window.set_size(Size::Logical(LogicalSize::new(dims.width, dims.height)))?;
    crate::tray::update_tray_gui_variant(&state, variant);
    Ok(())
}

#[tauri::command]
pub fn set_always_on_top(
    always_on_top: bool,
    window: Window,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    window.set_always_on_top(always_on_top)?;
    crate::tray::update_tray_always_on_top(&state, always_on_top);
    Ok(())
}

#[tauri::command]
pub fn minimize(window: Window) -> Result<(), AppError> {
    window.minimize()?;
    Ok(())
}

#[tauri::command]
pub fn close(window: Window) -> Result<(), AppError> {
    window.close()?;
    Ok(())
}

#[tauri::command]
pub fn hide(window: Window) -> Result<(), AppError> {
    window.hide()?;
    Ok(())
}

#[tauri::command]
pub fn show(window: Window) -> Result<(), AppError> {
    window.show()?;
    window.set_focus()?;
    Ok(())
}

#[tauri::command]
pub fn set_resizable(resizable: bool, window: Window) -> Result<(), AppError> {
    window.set_resizable(resizable)?;
    Ok(())
}
