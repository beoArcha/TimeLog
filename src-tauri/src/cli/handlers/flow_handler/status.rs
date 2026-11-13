use crate::cli::error::CliError;
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::engine::reports::constants::{ENTITY_PROJECT, ENTITY_TASK};
use crate::engine::{Engine, EngineError};
use crate::persistence::Persistence;
use crate::types::{ActiveSessionPayload, StatusPayload, TimeLog};

const SCHEMA_STATUS: EnvelopeSchema = EnvelopeSchema::new("oxy.status", 1);

pub fn handle_status(
    is_machine: bool,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    if is_machine {
        return status_envelope(persistence);
    }
    Ok(CliOutput::Status(engine.get_active_logs()?))
}

pub(super) fn status_envelope(persistence: &Persistence) -> Result<CliOutput, CliError> {
    let active = active_sessions(persistence)?;
    CliOutput::envelope(
        SCHEMA_STATUS,
        &StatusPayload {
            count: active.len() as u32,
            running: !active.is_empty(),
            active,
        },
    )
}

/// A running log whose task or project is gone is a storage inconsistency, so it fails as a
/// missing entity instead of being reported under a placeholder name.
pub(super) fn active_sessions(
    persistence: &Persistence,
) -> Result<Vec<ActiveSessionPayload>, CliError> {
    persistence
        .time_logs
        .get_all()?
        .into_iter()
        .filter(|log| log.end_time.is_none())
        .map(|log| active_session(persistence, log))
        .collect()
}

fn active_session(
    persistence: &Persistence,
    log: TimeLog,
) -> Result<ActiveSessionPayload, CliError> {
    let task = persistence
        .tasks
        .get(&log.task_id)?
        .ok_or_else(|| missing(ENTITY_TASK, &log.task_id))?;
    let project = persistence
        .projects
        .get(&task.project_id)?
        .ok_or_else(|| missing(ENTITY_PROJECT, &task.project_id))?;
    let elapsed = Engine::calculate_log_elapsed(&log)?;

    Ok(ActiveSessionPayload {
        task_id: task.id,
        task_name: task.name,
        project_id: project.id,
        project_name: project.name,
        start: log.start_time,
        elapsed_seconds: elapsed.as_secs(),
    })
}

fn missing(entity: &'static str, id: &str) -> CliError {
    CliError::from(EngineError::EntityNotFound {
        entity,
        id: id.to_string(),
    })
}
