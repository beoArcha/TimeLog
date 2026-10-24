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

pub fn parse_now_iso(
    now_iso: Option<String>,
) -> Result<Option<chrono::DateTime<chrono::Utc>>, AppError> {
    match now_iso {
        Some(ref iso) => {
            let dt = chrono::DateTime::parse_from_rfc3339(iso)
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .map_err(|e| {
                    crate::engine::EngineError::ParseTime(format!(
                        "Invalid RFC 3339 timestamp '{}': {}",
                        iso, e
                    ))
                })?;
            Ok(Some(dt))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub fn workflow_check_rules(
    now_iso: Option<String>,
    state: State<'_, AppState>,
) -> Result<WorkflowCheckResult, AppError> {
    let now = parse_now_iso(now_iso)?;
    let config = state.persistence.workflow.get_config()?;
    let result = state
        .workflow_daemon
        .check_rules_now(&state.persistence, &config, now)?;
    Ok(result)
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
