use crate::app::state::AppState;
use crate::commands::{
    app as app_cmds, engine,
    persistence::{core, project, settings, task, time_log},
    window,
};
use crate::common::constants::*;
use crate::tray;
use crate::types::FrontendEvent;

use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

pub fn create_builder() -> tauri::Builder<tauri::Wry> {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            engine::start_timer,
            engine::stop_timer,
            engine::resume_timer,
            engine::get_active_logs,
            engine::get_task_elapsed,
            engine::get_project_elapsed,
            engine::get_elapsed_range,
            engine::edit_time_log,
            engine::get_project_statistics,
            engine::get_computed_metrics,
            core::get_state,
            core::reset,
            project::add,
            project::toggle_archive,
            project::update_project,
            task::create,
            task::update_task,
            task::delete,
            task::toggle_complete,
            settings::get,
            settings::save,
            settings::get_runtime_configs,
            settings::save_runtime_config,
            time_log::get_for_task,
            time_log::close_active_by_project,
            time_log::close_all_active,
            time_log::insert,
            time_log::query_active,
            time_log::get_all,
            window::set_layout_variant,
            window::resize,
            window::set_always_on_top,
            window::minimize,
            window::close,
            window::hide,
            window::show,
            window::set_resizable,
            app_cmds::exit_app,
            app_cmds::set_minimize_to_tray
        ])
        .setup(setup_app)
        .on_window_event(handle_window_event)
}

fn setup_app(app: &mut tauri::App) -> std::result::Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&app_data_dir)?;
    let db_path = app_data_dir.join(DEFAULT_DB_NAME);
    let csv_directory = app_data_dir.join("csv");
    std::fs::create_dir_all(&csv_directory)?;

    let persistence_config = crate::persistence::PersistenceConfig {
        db_path,
        csv_directory,
    };
    let persistence =
        std::sync::Arc::new(crate::persistence::Persistence::new(&persistence_config)?);

    app.manage(AppState {
        persistence,
        was_maximized: std::sync::atomic::AtomicBool::new(false),
        minimize_to_tray: std::sync::atomic::AtomicBool::new(true),
    });

    let tray_menu = tray::build_tray_menu(app)?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip(APP_NAME)
        .menu(&tray_menu)
        .on_menu_event(tray::handle_menu_event)
        .on_tray_icon_event(handle_tray_icon_event)
        .build(app)?;

    Ok(())
}

fn handle_tray_icon_event(tray: &tauri::tray::TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
    } = event
    {
        if let Some(window) = tray.app_handle().get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

fn handle_window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
    let state = window.state::<AppState>();
    match event {
        tauri::WindowEvent::CloseRequested { api, .. } => {
            api.prevent_close();
            if state
                .minimize_to_tray
                .load(std::sync::atomic::Ordering::Relaxed)
            {
                let _ = window.hide();
            } else {
                window.app_handle().exit(0);
            }
        }
        tauri::WindowEvent::Resized(_) => {
            let is_max = window.is_maximized().unwrap_or(false);
            let was_max = state
                .was_maximized
                .load(std::sync::atomic::Ordering::Relaxed);

            if is_max && !was_max {
                state
                    .was_maximized
                    .store(true, std::sync::atomic::Ordering::Relaxed);
                let _ = window
                    .app_handle()
                    .emit(FrontendEvent::NativeWindowMaximized.as_str(), ());
            } else if !is_max && was_max {
                state
                    .was_maximized
                    .store(false, std::sync::atomic::Ordering::Relaxed);
                let _ = window
                    .app_handle()
                    .emit(FrontendEvent::NativeWindowRestored.as_str(), ());
            } else if let Ok(true) = window.is_minimized() {
                let _ = window.unminimize();
                let _ = window
                    .app_handle()
                    .emit(FrontendEvent::NativeWindowMinimized.as_str(), ());
            } else if !is_max {
                if let Ok(size) = window.inner_size() {
                    let scale_factor = window.scale_factor().unwrap_or(1.0);
                    let logical_width = size.width as f64 / scale_factor;
                    let logical_height = size.height as f64 / scale_factor;
                    let _ = window.app_handle().emit(
                        FrontendEvent::NativeWindowResized.as_str(),
                        (logical_width, logical_height),
                    );
                }
            }
        }
        _ => {}
    }
}

pub fn run_tauri() {
    create_builder()
        .run(tauri::generate_context!())
        .expect(APP_ERROR);
}
