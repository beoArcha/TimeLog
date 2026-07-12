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
    let engine = Engine::new(&state.persistence);
    if parent_task_id.is_some() {
        engine.validate_task_hierarchy(None, parent_task_id.as_deref())?;
    }

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
        status: Some(crate::types::TaskStatus::Todo),
    };
    if task.parent_task_id.is_some() {
        state.persistence.tasks.create_subtask(task)?;
    } else {
        state.persistence.tasks.create(task)?;
    }
    Ok(engine.get_state()?)
}

#[tauri::command]
pub fn update_task(
    task_id: String,
    name: String,
    parent_task_id: Option<String>,
    status: Option<crate::types::TaskStatus>,
    completed: Option<bool>,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(&state.persistence);
    if let Some(mut task) = state.persistence.tasks.get(&task_id)? {
        if task.parent_task_id != parent_task_id {
            engine.validate_task_hierarchy(Some(&task_id), parent_task_id.as_deref())?;
            task.parent_task_id = parent_task_id;
        }

        task.name = name;

        if let Some(comp) = completed {
            task.completed = comp;
            if comp {
                task.status = Some(crate::types::TaskStatus::Done);
            } else if task.status == Some(crate::types::TaskStatus::Done) {
                task.status = Some(crate::types::TaskStatus::Todo);
            }
        } else if let Some(stat) = status {
            task.status = Some(stat.clone());
            if stat == crate::types::TaskStatus::Done {
                task.completed = true;
            } else {
                task.completed = false;
            }
        }

        if task.completed {
            let state_data = engine.get_state()?;
            if let Some(ref active) = state_data.active_log {
                if active.task_id == task.id {
                    engine.stop_timer(None)?;
                }
            }
        }

        state.persistence.tasks.patch(task)?;
    }
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
    let engine = Engine::new(&state.persistence);
    if let Some(mut task) = state.persistence.tasks.get(&task_id)? {
        task.completed = !task.completed;
        if task.completed {
            task.status = Some(crate::types::TaskStatus::Done);
            let state_data = engine.get_state()?;
            if let Some(ref active) = state_data.active_log {
                if active.task_id == task.id {
                    engine.stop_timer(None)?;
                }
            }
        } else {
            task.status = Some(crate::types::TaskStatus::Todo);
        }
        state.persistence.tasks.patch(task)?;
    }
    Ok(engine.get_state()?)
}
