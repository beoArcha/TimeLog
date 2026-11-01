use crate::common::AppError;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{Project, TimerRepositoryState, TriState};
use crate::AppState;
use tauri::State;

#[derive(Debug, Clone)]
pub struct ProjectInput {
    pub name: String,
    pub color: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub tags: Option<Vec<String>>,
    pub allow_concurrency: Option<bool>,
    pub hourly_rate: Option<String>,
    pub currency: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ProjectUpdateInput {
    pub name: String,
    pub color: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub tags: Option<Vec<String>>,
    pub allow_concurrency: Option<bool>,
    pub hourly_rate: TriState<String>,
    pub currency: TriState<String>,
}

struct ValidatedProjectData {
    name: String,
    description: Option<String>,
    tags: Option<Vec<String>>,
}

fn validate_project_fields(
    engine: &Engine,
    name: &str,
    description: Option<&str>,
    tags: Option<Vec<String>>,
    project_id: Option<&str>,
) -> Result<ValidatedProjectData, AppError> {
    let name = engine.validate_project_name(name, project_id)?;
    let description = engine.validate_description(description)?;
    let tags = engine.validate_tags(tags)?;
    Ok(ValidatedProjectData {
        name,
        description,
        tags,
    })
}

fn get_project_or_fail(persistence: &Persistence, project_id: &str) -> Result<Project, AppError> {
    persistence.projects.get(project_id)?.ok_or_else(|| {
        AppError::Persistence(crate::persistence::PersistenceError::NotFound {
            entity: "Project",
            id: project_id.to_string(),
        })
    })
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
    let validated = validate_project_fields(
        &engine,
        &input.name,
        input.description.as_deref(),
        input.tags,
        None,
    )?;

    let mut project = Project::new(
        format!("proj_{}", chrono::Utc::now().timestamp_millis()),
        validated.name,
        input.color,
        validated.description,
        input.icon,
        validated.tags,
        input.allow_concurrency,
    );
    if let Some(rate_str) = input.hourly_rate {
        let trimmed = rate_str.trim();
        if !trimmed.is_empty() {
            let cents = crate::engine::billing::validate_and_parse_rate(trimmed)?;
            project.hourly_rate = Some(crate::engine::billing::format_cents(cents));
            project.billing_rate_cents =
                Some(crate::engine::billing::checked_billing_rate_to_i64(cents)?);
        }
    }
    if let Some(curr_str) = input.currency {
        let trimmed = curr_str.trim();
        if !trimmed.is_empty() {
            let validated_curr = crate::engine::billing::validate_currency_code(trimmed)?;
            project.currency = Some(validated_curr.clone());
            project.billing_currency = Some(validated_curr);
        }
    }
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
    input: ProjectUpdateInput,
) -> Result<TimerRepositoryState, AppError> {
    let engine = Engine::new(persistence);
    let validated = validate_project_fields(
        &engine,
        &input.name,
        input.description.as_deref(),
        input.tags,
        Some(project_id),
    )?;
    let mut project = get_project_or_fail(persistence, project_id)?;

    project.name = validated.name;
    project.color = input.color;
    project.description = validated.description;
    project.icon = input.icon;
    project.tags = validated.tags;
    project.allow_concurrency = input.allow_concurrency;

    if let Some(rate_opt) = input.hourly_rate.as_set() {
        match rate_opt {
            Some(rate_str) => {
                let trimmed = rate_str.trim();
                let cents = crate::engine::billing::validate_and_parse_rate(trimmed)?;
                project.hourly_rate = Some(crate::engine::billing::format_cents(cents));
                project.billing_rate_cents =
                    Some(crate::engine::billing::checked_billing_rate_to_i64(cents)?);
            }
            None => {
                project.hourly_rate = None;
                project.billing_rate_cents = None;
            }
        }
    }

    if let Some(curr_opt) = input.currency.as_set() {
        match curr_opt {
            Some(curr_str) => {
                let trimmed = curr_str.trim();
                let validated_curr = crate::engine::billing::validate_currency_code(trimmed)?;
                project.currency = Some(validated_curr.clone());
                project.billing_currency = Some(validated_curr);
            }
            None => {
                project.currency = None;
                project.billing_currency = None;
            }
        }
    }

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
#[allow(clippy::too_many_arguments)]
pub fn add(
    name: String,
    color: String,
    description: Option<String>,
    icon: Option<String>,
    tags: Option<Vec<String>>,
    allow_concurrency: Option<bool>,
    hourly_rate: Option<String>,
    currency: Option<String>,
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
            allow_concurrency,
            hourly_rate,
            currency,
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

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProjectDto {
    pub project_id: String,
    pub name: String,
    pub color: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub tags: Option<Vec<String>>,
    pub allow_concurrency: Option<bool>,
    #[serde(default)]
    pub hourly_rate: TriState<String>,
    #[serde(default)]
    pub currency: TriState<String>,
}

#[tauri::command]
pub fn update_project(
    input: UpdateProjectDto,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    update_project_details(
        &state.persistence,
        &input.project_id,
        ProjectUpdateInput {
            name: input.name,
            color: input.color,
            description: input.description,
            icon: input.icon,
            tags: input.tags,
            allow_concurrency: input.allow_concurrency,
            hourly_rate: input.hourly_rate,
            currency: input.currency,
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

pub fn delete_project_by_id(
    persistence: &Persistence,
    project_id: &str,
) -> Result<TimerRepositoryState, AppError> {
    persistence
        .projects
        .delete(project_id)
        .map_err(|err| match err {
            crate::persistence::PersistenceError::Validation(msg) => {
                AppError::Engine(crate::engine::EngineError::Validation(msg))
            }
            other => AppError::Persistence(other),
        })?;
    let engine = Engine::new(persistence);
    Ok(engine.get_state()?)
}

pub use delete_project_by_id as delete_project_details;

#[tauri::command]
pub fn delete_project(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<TimerRepositoryState, AppError> {
    delete_project_by_id(&state.persistence, &project_id)
}
