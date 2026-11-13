use super::format_log_duration;
use crate::cli::error::CliError;
use crate::cli::handlers::constants::{ERR_LOG_ADD_NO_DURATION_OR_FROM, MSG_LOG_RECORDED};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::{generate_id, parse_duration_seconds, parse_iso_or_rfc3339};
use crate::persistence::Persistence;
use crate::types::NewTimeLog;
use chrono::{DateTime, Duration, Utc};

const SCHEMA_LOG_ADD: EnvelopeSchema = EnvelopeSchema::new("oxy.log.add", 1);

pub(super) struct LogAddInput {
    pub(super) target: String,
    pub(super) duration: Option<String>,
    pub(super) note: Option<String>,
    pub(super) from: Option<String>,
    pub(super) to: Option<String>,
    pub(super) explicit_note: Option<String>,
}

pub(super) fn add_log(
    persistence: &Persistence,
    input: LogAddInput,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    let resolver = EntityResolver::with_mode(persistence, strict);
    let task = resolver.resolve_task(&input.target)?;

    let mut resolved_note = input.explicit_note.or(input.note);
    let (start_dt, end_dt) = resolve_add_log_timestamps(
        input.duration.as_deref(),
        input.from.as_deref(),
        input.to.as_deref(),
        &mut resolved_note,
    )?;

    if start_dt > end_dt {
        return Err(CliError::business_custom(
            "Log start time cannot be after end time.",
        ));
    }

    let id = generate_id();
    let new_log = NewTimeLog {
        id: id.clone(),
        task_id: task.id.clone(),
        start_time: start_dt.to_rfc3339(),
        end_time: Some(end_dt.to_rfc3339()),
        note: resolved_note,
    };

    persistence.time_logs.insert_full(&new_log)?;

    if is_machine {
        let log = persistence.time_logs.get_by_id(&id)?;
        return CliOutput::envelope(SCHEMA_LOG_ADD, &log);
    }

    let dur_display = format_log_duration(&new_log.start_time, new_log.end_time.as_deref());
    Ok(CliOutput::mutation(
        is_quiet,
        &id,
        MSG_LOG_RECORDED
            .replacen("{}", &dur_display, 1)
            .replacen("{}", &task.name, 1)
            .replacen("{}", &id, 1),
    ))
}

fn resolve_add_log_timestamps(
    duration: Option<&str>,
    from: Option<&str>,
    to: Option<&str>,
    resolved_note: &mut Option<String>,
) -> Result<(DateTime<Utc>, DateTime<Utc>), CliError> {
    if let Some(from_str) = from {
        let start_dt = parse_iso_or_rfc3339(from_str)?;
        let end_dt = resolve_end_from_start(start_dt, duration, to, resolved_note)?;
        return Ok((start_dt, end_dt));
    }

    if let Some(to_str) = to {
        let end_dt = parse_iso_or_rfc3339(to_str)?;
        let dur_str = duration
            .ok_or_else(|| CliError::syntax_invalid_args(ERR_LOG_ADD_NO_DURATION_OR_FROM))?;
        let dur_secs = parse_duration_seconds(dur_str)?;
        let start_dt = end_dt - Duration::seconds(dur_secs);
        return Ok((start_dt, end_dt));
    }

    let dur_str =
        duration.ok_or_else(|| CliError::syntax_invalid_args(ERR_LOG_ADD_NO_DURATION_OR_FROM))?;
    let dur_secs = parse_duration_seconds(dur_str)?;
    let end_dt = Utc::now();
    let start_dt = end_dt - Duration::seconds(dur_secs);
    Ok((start_dt, end_dt))
}

fn resolve_end_from_start(
    start_dt: DateTime<Utc>,
    duration: Option<&str>,
    to: Option<&str>,
    resolved_note: &mut Option<String>,
) -> Result<DateTime<Utc>, CliError> {
    if let Some(to_str) = to {
        adopt_candidate_as_note(duration, resolved_note);
        return parse_iso_or_rfc3339(to_str);
    }

    if let Some(dur_str) = duration {
        if let Ok(dur_secs) = parse_duration_seconds(dur_str) {
            return Ok(start_dt + Duration::seconds(dur_secs));
        }
        if resolved_note.is_none() {
            *resolved_note = Some(dur_str.to_string());
        }
    }

    Ok(Utc::now())
}

fn adopt_candidate_as_note(duration: Option<&str>, resolved_note: &mut Option<String>) {
    if let Some(dur_candidate) = duration {
        if parse_duration_seconds(dur_candidate).is_err() && resolved_note.is_none() {
            *resolved_note = Some(dur_candidate.to_string());
        }
    }
}
