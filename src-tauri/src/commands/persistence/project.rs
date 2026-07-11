use crate::common::AppError;
use crate::engine::Engine;
use crate::types::TimerRepositoryState;
use crate::AppState;
use tauri::State;

#[tauri::command(rename = "add_project")]
pub fn add(
    name: String,
    color: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    let project = crate::types::Project {
        id: format!("proj_{}", chrono::Utc::now().timestamp_millis()),
        name,
        color,
        created_at: chrono::Utc::now().to_rfc3339(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
    };
    state.persistence.projects.create(project)?;
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command(rename = "toggle_project_archive")]
pub fn toggle_archive(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    if let Some(mut project) = state.persistence.projects.get(&project_id)? {
        let archived = project.archived.unwrap_or(false);
        project.archived = Some(!archived);
        state.persistence.projects.patch(project)?;
    }
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command(rename = "rename_project")]
pub fn rename(
    project_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    if let Some(mut project) = state.persistence.projects.get(&project_id)? {
        project.name = name;
        state.persistence.projects.patch(project)?;
    }
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}
