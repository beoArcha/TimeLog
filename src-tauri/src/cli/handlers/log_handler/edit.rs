use crate::cli::error::CliError;
use crate::cli::handlers::constants::{
    ERR_LOG_EDIT_EMPTY, ERR_LOG_EDIT_NO_REASON, MSG_LOG_UPDATED,
};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::{parse_duration_seconds, parse_iso_or_rfc3339};
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{AuditSource, TimeLogEditInput};
use chrono::{Duration, Utc};

const SCHEMA_LOG_EDIT: EnvelopeSchema = EnvelopeSchema::new("oxy.log.edit", 1);

pub(super) struct LogEditInput {
    pub(super) id: String,
    pub(super) duration: Option<String>,
    pub(super) note: Option<String>,
    pub(super) start: Option<String>,
    pub(super) end: Option<String>,
    pub(super) task: Option<String>,
    pub(super) reason: Option<String>,
}

pub(super) fn edit_log(
    persistence: &Persistence,
    input: LogEditInput,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    if input.duration.is_none()
        && input.note.is_none()
        && input.start.is_none()
        && input.end.is_none()
        && input.task.is_none()
    {
        return Err(CliError::syntax_invalid_args(ERR_LOG_EDIT_EMPTY));
    }

    let trimmed_reason = match input.reason {
        Some(ref r) if !r.trim().is_empty() => r.trim(),
        _ => return Err(CliError::syntax_invalid_args(ERR_LOG_EDIT_NO_REASON)),
    };

    let existing = persistence.time_logs.get_by_id(&input.id)?;

    let target_task_id = match input.task {
        Some(ref target) => {
            let resolver = EntityResolver::with_mode(persistence, strict);
            let t = resolver.resolve_task(target)?;
            t.id
        }
        None => existing.task_id.clone(),
    };

    let new_start = match input.start {
        Some(ref st) => parse_iso_or_rfc3339(st)?.to_rfc3339(),
        None => calculate_adjusted_start_time(&existing, input.duration.as_deref())?,
    };

    let new_end = match input.end {
        Some(ref et) => Some(parse_iso_or_rfc3339(et)?.to_rfc3339()),
        None => existing.end_time.clone(),
    };

    let new_note = input.note.as_deref().or(existing.note.as_deref());

    let engine = Engine::new(persistence);
    engine.edit_log(TimeLogEditInput {
        id: &existing.id,
        task_id: &target_task_id,
        start_time: &new_start,
        end_time: new_end.as_deref(),
        note: new_note,
        reason: Some(trimmed_reason),
        audit_source: Some(AuditSource::CliEdit),
    })?;

    if is_machine {
        let log = persistence.time_logs.get_by_id(&input.id)?;
        return CliOutput::envelope(SCHEMA_LOG_EDIT, &log);
    }

    Ok(CliOutput::mutation(
        is_quiet,
        &input.id,
        MSG_LOG_UPDATED.replace("{}", &input.id),
    ))
}

fn calculate_adjusted_start_time(
    existing: &crate::types::TimeLog,
    duration: Option<&str>,
) -> Result<String, CliError> {
    if let Some(dur) = duration {
        let secs = parse_duration_seconds(dur)?;
        let end = match &existing.end_time {
            Some(e) => parse_iso_or_rfc3339(e)?,
            None => Utc::now(),
        };
        let st = end - Duration::seconds(secs);
        Ok(st.to_rfc3339())
    } else {
        Ok(existing.start_time.clone())
    }
}
