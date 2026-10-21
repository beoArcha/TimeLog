use super::constants::ERR_PROJECT_NOT_FOUND;
use crate::common::AppError;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{Project, TimerRepositoryState};
use crate::AppState;
use tauri::State;

#[derive(Debug, Clone)]
pub struct ProjectInput {
    pub name: String,
    pub color: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub tags: Option<Vec<String>>,
}

struct ValidatedProjectData {
    name: String,
    description: Option<String>,
    tags: Option<Vec<String>>,
}

fn validate_project_input(
    engine: &Engine,
    input: &ProjectInput,
    project_id: Option<&str>,
) -> Result<ValidatedProjectData, AppError> {
    let name = engine.validate_project_name(&input.name, project_id)?;
    let description = engine.validate_description(input.description.as_deref())?;
    let tags = engine.validate_tags(input.tags.clone())?;
    Ok(ValidatedProjectData {
        name,
        description,
        tags,
    })
}

fn get_project_or_fail(persistence: &Persistence, project_id: &str) -> Result<Project, AppError> {
    persistence
        .projects
        .get(project_id)?
        .ok_or_else(|| AppError::Generic(ERR_PROJECT_NOT_FOUND.replace("{}", project_id)))
}

fn stop_active_timer_if_project_matching(
    engine: &Engine,
    project_id: &str,
) -> Result<(), AppError> {
    if let Some(active_log) = engine.get_state()?.active_log {
        if active_log.project_id == project_id {
            engine.stop_timer(None)?;
        }
    }
    Ok(())
}

pub fn add_project(
    persistence: &Persistence,
    input: ProjectInput,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(persistence);
    let validated = validate_project_input(&engine, &input, None)?;

    let project = Project::new(
        format!("proj_{}", chrono::Utc::now().timestamp_millis()),
        validated.name,
        input.color,
        validated.description,
        input.icon,
        validated.tags,
    );
    persistence.projects.create(project)?;
    Ok(engine.get_state()?)
}

pub fn toggle_project_archive(
    persistence: &Persistence,
    project_id: &str,
) -> Result<TimerRepositoryState, AppError> {
    let mut project = get_project_or_fail(persistence, project_id)?;
    let will_be_archived = !project.archived.unwrap_or(false);
    let engine = Engine::new(persistence);

    if will_be_archived {
        stop_active_timer_if_project_matching(&engine, project_id)?;
    }

    project.archived = Some(will_be_archived);
    persistence.projects.patch(project)?;
    Ok(engine.get_state()?)
}

pub fn update_project_details(
    persistence: &Persistence,
    project_id: &str,
    input: ProjectInput,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(persistence);
    let validated = validate_project_input(&engine, &input, Some(project_id))?;
    let mut project = get_project_or_fail(persistence, project_id)?;

    project.name = validated.name;
    project.color = input.color;
    project.description = validated.description;
    project.icon = input.icon;
    project.tags = validated.tags;
    persistence.projects.patch(project)?;

    Ok(engine.get_state()?)
}

pub fn rename_project_name(
    persistence: &Persistence,
    project_id: &str,
    new_name: &str,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(persistence);
    let valid_name = engine.validate_project_name(new_name, Some(project_id))?;
    let mut project = get_project_or_fail(persistence, project_id)?;

    project.name = valid_name;
    persistence.projects.patch(project)?;
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn add(
    name: String,
    color: String,
    description: Option<String>,
    icon: Option<String>,
    tags: Option<Vec<String>>,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    add_project(
        &state.persistence,
        ProjectInput {
            name,
            color,
            description,
            icon,
            tags,
        },
    )
}

#[tauri::command]
pub fn toggle_archive(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    toggle_project_archive(&state.persistence, &project_id)
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
    update_project_details(
        &state.persistence,
        &project_id,
        ProjectInput {
            name,
            color,
            description,
            icon,
            tags,
        },
    )
}

#[tauri::command]
pub fn rename_project(
    project_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    rename_project_name(&state.persistence, &project_id, &name)
}
