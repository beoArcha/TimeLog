use crate::errors::AppError;
use crate::types::{GuiSize, TextAndIconSize};
use tauri::{LogicalSize, Size, Window};

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
