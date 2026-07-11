use crate::common::AppError;
use crate::engine::Engine;
use crate::types::TimerRepositoryState;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn create(
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
        state.persistence.tasks.create(task)?;
    }
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn update(
    task_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    if let Some(mut task) = state.persistence.tasks.get(&task_id)? {
        task.name = name;
        state.persistence.tasks.patch(task)?;
    }
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn delete(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    if let Some(task) = state.persistence.tasks.get(&task_id)? {
        if task.parent_task_id.is_some() {
            state
                .persistence
                .tasks
                .archive_subtask(task_id, task.project_id)?;
        } else {
            state.persistence.tasks.archive(task_id, task.project_id)?;
        }
    }
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn toggle_complete(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    if let Some(mut task) = state.persistence.tasks.get(&task_id)? {
        task.completed = !task.completed;
        state.persistence.tasks.patch(task)?;
    }
    let engine = Engine::new(&state.persistence);
    Ok(engine.get_state()?)
}
