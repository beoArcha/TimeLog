pub mod handlers;
pub mod ids;
pub mod localization;
pub mod menu;

pub use handlers::{
    handle_menu_event, update_tray_always_on_top, update_tray_gui_variant,
    update_tray_minimize_to_tray,
};
pub use menu::build_tray_menu;
