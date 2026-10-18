use crate::app::state::{AppState, TrayCheckHandles};
use crate::tray::ids::TrayMenuId;
use crate::types::{LayoutVariant, Locale};
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    App,
};

fn get_system_locale() -> Locale {
    let sys_lang = sys_locale::get_locale().unwrap_or_else(|| "en".to_string());
    Locale::from_sys_lang(&sys_lang)
}

pub fn build_tray_menu(
    app: &App,
    initial_variant: LayoutVariant,
    initial_always_on_top: bool,
    initial_minimize_to_tray: bool,
    initial_locale: Option<Locale>,
) -> tauri::Result<(Menu<tauri::Wry>, TrayCheckHandles)> {
    let locale = initial_locale.unwrap_or_else(get_system_locale);

    let toggle_item = MenuItem::with_id(
        app,
        TrayMenuId::ToggleVisibility.as_str(),
        TrayMenuId::ToggleVisibility.get_text(locale),
        true,
        None::<&str>,
    )?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let gui_compact = CheckMenuItem::with_id(
        app,
        TrayMenuId::GuiCompact.as_str(),
        TrayMenuId::GuiCompact.get_text(locale),
        true,
        initial_variant == LayoutVariant::Compact,
        None::<&str>,
    )?;
    let gui_medium = CheckMenuItem::with_id(
        app,
        TrayMenuId::GuiMedium.as_str(),
        TrayMenuId::GuiMedium.get_text(locale),
        true,
        initial_variant == LayoutVariant::Medium,
        None::<&str>,
    )?;
    let gui_full = CheckMenuItem::with_id(
        app,
        TrayMenuId::GuiFull.as_str(),
        TrayMenuId::GuiFull.get_text(locale),
        true,
        initial_variant == LayoutVariant::Full,
        None::<&str>,
    )?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let toggle_on_top = CheckMenuItem::with_id(
        app,
        TrayMenuId::ToggleOnTop.as_str(),
        TrayMenuId::ToggleOnTop.get_text(locale),
        true,
        initial_always_on_top,
        None::<&str>,
    )?;
    let toggle_minimize_to_tray = CheckMenuItem::with_id(
        app,
        TrayMenuId::ToggleMinimizeToTray.as_str(),
        TrayMenuId::ToggleMinimizeToTray.get_text(locale),
        true,
        initial_minimize_to_tray,
        None::<&str>,
    )?;
    let stop_all = MenuItem::with_id(
        app,
        TrayMenuId::StopAllTimers.as_str(),
        TrayMenuId::StopAllTimers.get_text(locale),
        true,
        None::<&str>,
    )?;
    let sep3 = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(
        app,
        TrayMenuId::QuitApp.as_str(),
        TrayMenuId::QuitApp.get_text(locale),
        true,
        None::<&str>,
    )?;

    let tray_menu = Menu::with_items(
        app,
        &[
            &toggle_item,
            &sep1,
            &gui_compact,
            &gui_medium,
            &gui_full,
            &sep2,
            &toggle_on_top,
            &toggle_minimize_to_tray,
            &stop_all,
            &sep3,
            &quit_item,
        ],
    )?;

    let handles = TrayCheckHandles {
        toggle_visibility: toggle_item,
        gui_compact,
        gui_medium,
        gui_full,
        toggle_on_top,
        toggle_minimize_to_tray,
        stop_all,
        quit_app: quit_item,
    };

    Ok((tray_menu, handles))
}

pub fn update_tray_menu_locale(state: &AppState, locale: Locale) -> tauri::Result<()> {
    if let Some(ref handles) = state.tray_handles {
        handles
            .toggle_visibility
            .set_text(TrayMenuId::ToggleVisibility.get_text(locale))?;
        handles
            .gui_compact
            .set_text(TrayMenuId::GuiCompact.get_text(locale))?;
        handles
            .gui_medium
            .set_text(TrayMenuId::GuiMedium.get_text(locale))?;
        handles
            .gui_full
            .set_text(TrayMenuId::GuiFull.get_text(locale))?;
        handles
            .toggle_on_top
            .set_text(TrayMenuId::ToggleOnTop.get_text(locale))?;
        handles
            .toggle_minimize_to_tray
            .set_text(TrayMenuId::ToggleMinimizeToTray.get_text(locale))?;
        handles
            .stop_all
            .set_text(TrayMenuId::StopAllTimers.get_text(locale))?;
        handles
            .quit_app
            .set_text(TrayMenuId::QuitApp.get_text(locale))?;
    }
    Ok(())
}
