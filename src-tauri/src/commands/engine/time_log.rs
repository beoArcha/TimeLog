use crate::common::AppError;
use crate::engine::Engine;
use crate::AppState;
use tauri::State;

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn edit_time_log(
    id: String,
    task_id: String,
    start_time: String,
    end_time: Option<String>,
    note: Option<String>,
    reason: Option<String>,
    audit_source: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    let engine = Engine::new(&state.persistence);
    let parsed_audit_source = match audit_source {
        Some(ref s) if !s.trim().is_empty() => Some(crate::types::AuditSource::from_raw_str(s)?),
        _ => None,
    };
    engine.edit_log(crate::types::TimeLogEditInput {
        id: &id,
        task_id: &task_id,
        start_time: &start_time,
        end_time: end_time.as_deref(),
        note: note.as_deref(),
        reason: reason.as_deref(),
        audit_source: parsed_audit_source,
    })?;
    Ok(())
}
