use crate::common::AppError;
use crate::engine::Engine;
use crate::types::{Settings, TimerRepositoryState};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_timer_state(state: State<'_, AppState>) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    let current_state = engine.get_state()?;
    Ok(current_state)
}

#[tauri::command]
pub fn add_project(
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
    state.persistence.projects.create_project(project)?;
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn toggle_project_archive(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    if let Some(mut project) = state.persistence.projects.get_project(&project_id)? {
        let archived = project.archived.unwrap_or(false);
        project.archived = Some(!archived);
        state.persistence.projects.patch_project(project)?;
    }
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn add_task(
    project_id: String,
    name: String,
    parent_task_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    let task = crate::types::Task {
        id: format!("task_{}", chrono::Utc::now().timestamp_millis()),
        project_id,
        parent_task_id,
        name,
        created_at: chrono::Utc::now().to_rfc3339(),
        completed: false,
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    if task.parent_task_id.is_some() {
        state.persistence.tasks.create_subtask(task)?;
    } else {
        state.persistence.tasks.create_task(task)?;
    }
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn rename_project(
    project_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    if let Some(mut project) = state.persistence.projects.get_project(&project_id)? {
        project.name = name;
        state.persistence.projects.patch_project(project)?;
    }
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn rename_task(
    task_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    if let Some(mut task) = state.persistence.tasks.get_task(&task_id)? {
        task.name = name;
        state.persistence.tasks.patch_task(task)?;
    }
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn delete_task(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    if let Some(task) = state.persistence.tasks.get_task(&task_id)? {
        if task.parent_task_id.is_some() {
            state.persistence.tasks.archive_subtask(task_id, task.project_id)?;
        } else {
            state.persistence.tasks.archive_task(task_id, task.project_id)?;
        }
    }
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn toggle_task_complete(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    if let Some(mut task) = state.persistence.tasks.get_task(&task_id)? {
        task.completed = !task.completed;
        state.persistence.tasks.patch_task(task)?;
    }
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn reset_database(state: State<'_, AppState>) -> Result<TimerRepositoryState, AppError> {
    state.persistence.core.clear_all_data()?;
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<Settings, AppError> {
    let settings = state.persistence.settings.get_settings()?;
    Ok(settings)
}

#[tauri::command]
pub fn save_settings(settings: Settings, state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.settings.save_settings(settings)?;
    Ok(())
}
