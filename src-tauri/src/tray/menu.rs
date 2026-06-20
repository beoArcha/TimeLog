use crate::tray::ids::TrayMenuId;
use crate::types::Locale;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    App,
};

fn get_system_locale() -> Locale {
    let sys_lang = sys_locale::get_locale().unwrap_or_else(|| "en".to_string());
    Locale::from_sys_lang(&sys_lang)
}

fn create_menu_item<R: tauri::Runtime>(
    app: &App<R>,
    id: TrayMenuId,
    locale: Locale,
) -> tauri::Result<MenuItem<R>> {
    MenuItem::with_id(app, id.as_str(), id.get_text(locale), true, None::<&str>)
}

pub fn build_tray_menu<R: tauri::Runtime>(app: &App<R>) -> tauri::Result<Menu<R>> {
    let locale = get_system_locale();

    let toggle_item = create_menu_item(app, TrayMenuId::ToggleVisibility, locale)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let gui_small = create_menu_item(app, TrayMenuId::GuiSmall, locale)?;
    let gui_medium = create_menu_item(app, TrayMenuId::GuiMedium, locale)?;
    let gui_large = create_menu_item(app, TrayMenuId::GuiLarge, locale)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let toggle_on_top = create_menu_item(app, TrayMenuId::ToggleOnTop, locale)?;
    let stop_all = create_menu_item(app, TrayMenuId::StopAllTimers, locale)?;
    let sep3 = PredefinedMenuItem::separator(app)?;
    let quit_item = create_menu_item(app, TrayMenuId::QuitApp, locale)?;

    let tray_menu = Menu::with_items(
        app,
        &[
            &toggle_item,
            &sep1,
            &gui_small,
            &gui_medium,
            &gui_large,
            &sep2,
            &toggle_on_top,
            &stop_all,
            &sep3,
            &quit_item,
        ],
    )?;

    Ok(tray_menu)
}
