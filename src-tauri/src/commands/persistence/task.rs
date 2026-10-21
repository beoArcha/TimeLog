use super::constants::ERR_TASK_NOT_FOUND;
use crate::common::AppError;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{Task, TaskStatus, TimerRepositoryState};
use crate::AppState;
use tauri::State;

#[derive(Debug, Clone)]
pub struct TaskUpdateInput {
    pub name: String,
    pub parent_task_id: Option<String>,
    pub status: Option<TaskStatus>,
    pub completed: Option<bool>,
}

fn get_task_or_fail(persistence: &Persistence, task_id: &str) -> Result<Task, AppError> {
    persistence
        .tasks
        .get(task_id)?
        .ok_or_else(|| AppError::Generic(ERR_TASK_NOT_FOUND.replace("{}", task_id)))
}

fn apply_status_and_completion(
    task: &mut Task,
    status: Option<TaskStatus>,
    completed: Option<bool>,
) {
    if let Some(comp) = completed {
        task.completed = comp;
        task.status = Some(if comp {
            TaskStatus::Done
        } else {
            TaskStatus::Todo
        });
    } else if let Some(stat) = status {
        task.completed = stat == TaskStatus::Done;
        task.status = Some(stat);
    }
}

fn stop_active_timer_if_matching_task(engine: &Engine, task_id: &str) -> Result<(), AppError> {
    let state_data = engine.get_state()?;
    if let Some(ref active) = state_data.active_log {
        if active.task_id == task_id {
            engine.stop_timer(None)?;
        }
    }
    Ok(())
}

fn stop_active_timer_if_task_or_subtask(
    engine: &Engine,
    persistence: &Persistence,
    task_id: &str,
) -> Result<(), AppError> {
    let state_data = engine.get_state()?;
    if let Some(ref active) = state_data.active_log {
        let is_target = active.task_id == task_id;
        let is_subtask = if !is_target {
            let subtasks = persistence.tasks.get_subtasks(task_id)?;
            subtasks.iter().any(|s| s.id == active.task_id)
        } else {
            false
        };
        if is_target || is_subtask {
            engine.stop_timer(None)?;
        }
    }
    Ok(())
}

pub fn create_task(
    persistence: &Persistence,
    project_id: &str,
    name: &str,
    parent_task_id: Option<&str>,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(persistence);
    let valid_name = engine.validate_task_name(name)?;
    if parent_task_id.is_some() {
        engine.validate_task_hierarchy(None, parent_task_id)?;
    }

    let task = Task::new(
        format!("task_{}", chrono::Utc::now().timestamp_millis()),
        project_id.to_string(),
        parent_task_id.map(str::to_string),
        valid_name,
    );

    if task.parent_task_id.is_some() {
        persistence.tasks.create_subtask(task)?;
    } else {
        persistence.tasks.create(task)?;
    }
    Ok(engine.get_state()?)
}

pub fn update_task_details(
    persistence: &Persistence,
    task_id: &str,
    input: TaskUpdateInput,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(persistence);
    let mut task = get_task_or_fail(persistence, task_id)?;

    if task.parent_task_id.as_deref() != input.parent_task_id.as_deref() {
        engine.validate_task_hierarchy(Some(task_id), input.parent_task_id.as_deref())?;
        task.parent_task_id = input.parent_task_id;
    }

    let valid_name = engine.validate_task_name(&input.name)?;
    task.name = valid_name;

    apply_status_and_completion(&mut task, input.status, input.completed);

    if task.completed {
        stop_active_timer_if_matching_task(&engine, &task.id)?;
    }

    persistence.tasks.patch(task)?;
    Ok(engine.get_state()?)
}

pub fn delete_task(
    persistence: &Persistence,
    task_id: &str,
) -> Result<TimerRepositoryState, AppError> {
    let task = get_task_or_fail(persistence, task_id)?;
    let engine = Engine::new(persistence);
    stop_active_timer_if_task_or_subtask(&engine, persistence, task_id)?;

    if task.parent_task_id.is_some() {
        persistence
            .tasks
            .archive_subtask(task_id.to_string(), task.project_id)?;
    } else {
        persistence
            .tasks
            .archive(task_id.to_string(), task.project_id)?;
    }

    Ok(engine.get_state()?)
}

pub fn toggle_task_completion(
    persistence: &Persistence,
    task_id: &str,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(persistence);
    let mut task = get_task_or_fail(persistence, task_id)?;
    task.completed = !task.completed;
    task.status = Some(if task.completed {
        TaskStatus::Done
    } else {
        TaskStatus::Todo
    });
    if task.completed {
        stop_active_timer_if_matching_task(&engine, &task.id)?;
    }
    persistence.tasks.patch(task)?;
    Ok(engine.get_state()?)
}

pub fn rename_task_name(
    persistence: &Persistence,
    task_id: &str,
    new_name: &str,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(persistence);
    let valid_name = engine.validate_task_name(new_name)?;
    let mut task = get_task_or_fail(persistence, task_id)?;
    task.name = valid_name;
    persistence.tasks.patch(task)?;
    Ok(engine.get_state()?)
}

pub fn get_task_project(persistence: &Persistence, task_id: &str) -> Result<String, AppError> {
    let task = get_task_or_fail(persistence, task_id)?;
    Ok(task.project_id)
}

pub fn fetch_subtasks(persistence: &Persistence, task_id: &str) -> Result<Vec<Task>, AppError> {
    Ok(persistence.tasks.get_subtasks(task_id)?)
}

#[tauri::command]
pub fn create(
    project_id: String,
    name: String,
    parent_task_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    create_task(
        &state.persistence,
        &project_id,
        &name,
        parent_task_id.as_deref(),
    )
}

#[tauri::command]
pub fn update_task(
    task_id: String,
    name: String,
    parent_task_id: Option<String>,
    status: Option<TaskStatus>,
    completed: Option<bool>,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    update_task_details(
        &state.persistence,
        &task_id,
        TaskUpdateInput {
            name,
            parent_task_id,
            status,
            completed,
        },
    )
}

#[tauri::command]
pub fn delete(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    delete_task(&state.persistence, &task_id)
}

#[tauri::command]
pub fn toggle_complete(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    toggle_task_completion(&state.persistence, &task_id)
}

#[tauri::command]
pub fn rename_task(
    task_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    rename_task_name(&state.persistence, &task_id, &name)
}

#[tauri::command]
pub fn get_task_project_id(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    get_task_project(&state.persistence, &task_id)
}

#[tauri::command]
pub fn get_subtasks(task_id: String, state: State<'_, AppState>) -> Result<Vec<Task>, AppError> {
    fetch_subtasks(&state.persistence, &task_id)
}
