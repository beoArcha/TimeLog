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
    SetLayoutVariant,
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
    ResumeTimer,
    GetActiveLogs,
    GetTaskElapsed,
    GetProjectElapsed,
    GetElapsedRange,
    EditTimeLog,
    GetProjectStatistics,
    GetComputedMetrics,
    BillingResolveEffectiveRate,
    BillingCalculateRange,
}

#[derive(TS, Serialize)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum CorePersistenceCommand {
    GetState,
    Reset,
}

#[derive(TS, Serialize)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum ProjectsPersistenceCommand {
    Add,
    UpdateProject,
    ToggleArchive,
    RenameProject,
    DeleteProject,
}

#[derive(TS, Serialize)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum TasksPersistenceCommand {
    Create,
    UpdateTask,
    Delete,
    ToggleComplete,
    RenameTask,
    GetTaskProjectId,
    GetSubtasks,
}

#[derive(TS, Serialize)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum SettingsPersistenceCommand {
    Get,
    Save,
}
