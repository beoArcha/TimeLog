use serde::Serialize;
use ts_rs::TS;

#[derive(TS, Serialize)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum AppCommand {
    ExitApp,
    SetMinimizeToTray,
}

#[derive(TS, Serialize)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum WindowCommand {
    Resize,
    SetSize,
    SetAlwaysOnTop,
    Minimize,
    Close,
    Hide,
    Show,
    SetResizable,
}

#[derive(TS, Serialize)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum EngineCommand {
    StartTimer,
    StopTimer,
    GetActiveLogs,
}

#[derive(TS, Serialize)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum CorePersistenceCommand {
    GetTimerState,
    ResetDatabase,
}

#[derive(TS, Serialize)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum ProjectsPersistenceCommand {
    AddProject,
    RenameProject,
    ToggleProjectArchive,
}

#[derive(TS, Serialize)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum TasksPersistenceCommand {
    AddTask,
    RenameTask,
    DeleteTask,
    ToggleTaskComplete,
}

#[derive(TS, Serialize)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum SettingsPersistenceCommand {
    GetSettings,
    SaveSettings,
}
