use crate::app::state::AppState;
use crate::common::AppError;
use crate::types::{WorkflowCheckResult, WorkflowConfig, WorkflowStatus};
use tauri::State;

#[tauri::command]
pub fn workflow_get_config(state: State<'_, AppState>) -> Result<WorkflowConfig, AppError> {
    Ok(state.persistence.workflow.get_config()?)
}

#[tauri::command]
pub fn workflow_save_config(
    config: WorkflowConfig,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.persistence.workflow.save_config(&config)?;
    Ok(())
}

#[tauri::command]
pub fn workflow_get_status(state: State<'_, AppState>) -> Result<WorkflowStatus, AppError> {
    Ok(state.workflow_daemon.get_status())
}

#[tauri::command]
pub fn workflow_check_rules(
    now_iso: Option<String>,
    state: State<'_, AppState>,
) -> Result<WorkflowCheckResult, AppError> {
    let now = match now_iso {
        Some(iso) => chrono::DateTime::parse_from_rfc3339(&iso)
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .ok(),
        None => None,
    };
    let config = state.persistence.workflow.get_config()?;
    Ok(state
        .workflow_daemon
        .check_rules_now(&state.persistence, &config, now))
}

#[tauri::command]
pub fn workflow_start_daemon(state: State<'_, AppState>) -> Result<(), AppError> {
    state.workflow_daemon.start(state.persistence.clone());
    Ok(())
}

#[tauri::command]
pub fn workflow_stop_daemon(state: State<'_, AppState>) -> Result<(), AppError> {
    state.workflow_daemon.stop();
    Ok(())
}
