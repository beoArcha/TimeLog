use serde::Serialize;
use ts_rs::TS;

#[derive(TS, Serialize)]
#[ts(export)]
pub enum AppCommand {
    #[serde(rename = "exit_app")]
    ExitApp,
    #[serde(rename = "set_minimize_to_tray")]
    SetMinimizeToTray,
}

#[derive(TS, Serialize)]
#[ts(export)]
pub enum WindowCommand {
    #[serde(rename = "resize_window")]
    ResizeWindow,
    #[serde(rename = "set_gui_size")]
    SetGuiSize,
    #[serde(rename = "set_always_on_top")]
    SetAlwaysOnTop,
    #[serde(rename = "minimize_window")]
    MinimizeWindow,
    #[serde(rename = "close_window")]
    CloseWindow,
    #[serde(rename = "hide_window")]
    HideWindow,
    #[serde(rename = "show_window")]
    ShowWindow,
    #[serde(rename = "set_window_resizable")]
    SetWindowResizable,
}

#[derive(TS, Serialize)]
#[ts(export)]
pub enum EngineCommand {
    #[serde(rename = "start_timer")]
    StartTimer,
    #[serde(rename = "stop_timer")]
    StopTimer,
    #[serde(rename = "get_active_logs")]
    GetActiveLogs,
}

#[derive(TS, Serialize)]
#[ts(export)]
pub enum PersistenceCommand {
    #[serde(rename = "get_timer_state")]
    GetTimerState,
    #[serde(rename = "add_project")]
    AddProject,
    #[serde(rename = "toggle_project_archive")]
    ToggleProjectArchive,
    #[serde(rename = "add_task")]
    AddTask,
    #[serde(rename = "rename_project")]
    RenameProject,
    #[serde(rename = "rename_task")]
    RenameTask,
    #[serde(rename = "delete_task")]
    DeleteTask,
    #[serde(rename = "toggle_task_complete")]
    ToggleTaskComplete,
    #[serde(rename = "reset_database")]
    ResetDatabase,
    #[serde(rename = "get_settings")]
    GetSettings,
    #[serde(rename = "save_settings")]
    SaveSettings,
}
