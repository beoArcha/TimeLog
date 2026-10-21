use crate::common::AppError;
use crate::engine::Engine;
use crate::types::{Project, TimerRepositoryState};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn add(
    name: String,
    color: String,
    description: Option<String>,
    icon: Option<String>,
    tags: Option<Vec<String>>,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    let valid_name = engine.validate_project_name(&name, None)?;
    let valid_desc = engine.validate_description(description.as_deref())?;
    let valid_tags = engine.validate_tags(tags)?;

    let project = Project::new(
        format!("proj_{}", chrono::Utc::now().timestamp_millis()),
        valid_name,
        color,
        valid_desc,
        icon,
        valid_tags,
    );
    state.persistence.projects.create(project)?;
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn toggle_archive(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    let mut project = state
        .persistence
        .projects
        .get(&project_id)?
        .ok_or_else(|| AppError::Generic(format!("Project with ID '{}' not found", project_id)))?;

    let archived = project.archived.unwrap_or(false);
    project.archived = Some(!archived);
    state.persistence.projects.patch(project)?;

    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn update_project(
    project_id: String,
    name: String,
    color: String,
    description: Option<String>,
    icon: Option<String>,
    tags: Option<Vec<String>>,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    let valid_name = engine.validate_project_name(&name, Some(&project_id))?;
    let valid_desc = engine.validate_description(description.as_deref())?;
    let valid_tags = engine.validate_tags(tags)?;

    let mut project = state
        .persistence
        .projects
        .get(&project_id)?
        .ok_or_else(|| AppError::Generic(format!("Project with ID '{}' not found", project_id)))?;

    project.name = valid_name;
    project.color = color;
    project.description = valid_desc;
    project.icon = icon;
    project.tags = valid_tags;
    state.persistence.projects.patch(project)?;

    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn rename_project(
    project_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    let valid_name = engine.validate_project_name(&name, Some(&project_id))?;

    let mut project = state
        .persistence
        .projects
        .get(&project_id)?
        .ok_or_else(|| AppError::Generic(format!("Project with ID '{}' not found", project_id)))?;

    project.name = valid_name;
    state.persistence.projects.patch(project)?;

    Ok(engine.get_state()?)
}
