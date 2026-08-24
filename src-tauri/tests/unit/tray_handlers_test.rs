use crate::shared::test_db::setup_persistence_test;
use oxy_flow::app::state::AppState;
use oxy_flow::persistence::Persistence;
use oxy_flow::tray::handlers::{update_tray_always_on_top, update_tray_gui_variant};
use oxy_flow::types::LayoutVariant;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;

#[test]
fn test_update_tray_state_handles_none() {
    let (_conn, config, _temp_dir) = setup_persistence_test("tray_handlers_test");
    let persistence = Arc::new(Persistence::new(&config).unwrap());
    let state = AppState {
        persistence,
        was_maximized: AtomicBool::new(false),
        minimize_to_tray: AtomicBool::new(true),
        tray_handles: None,
    };

    // Should not panic when tray_handles is None
    update_tray_gui_variant(&state, LayoutVariant::Compact);
    update_tray_gui_variant(&state, LayoutVariant::Medium);
    update_tray_gui_variant(&state, LayoutVariant::Full);
    update_tray_always_on_top(&state, true);
    update_tray_always_on_top(&state, false);
}
