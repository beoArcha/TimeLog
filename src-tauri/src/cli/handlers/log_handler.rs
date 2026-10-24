use super::constants::{
    ERR_LOG_ADD_NO_DURATION_OR_FROM, ERR_LOG_EDIT_EMPTY, FORMAT_DURATION_MINS_SECS,
    FORMAT_LOG_NOTE, FORMAT_LOG_ROW, HEADER_TIME_LOGS, LABEL_ACTIVE_TIMER, LABEL_INVALID_DURATION,
    LABEL_UNKNOWN_TASK, MSG_LOG_DELETED, MSG_LOG_RECORDED, MSG_LOG_UPDATED, MSG_NO_LOGS_FOUND,
};
use crate::cli::error::CliError;
use crate::cli::parser::tier2_entities::{LogArgs, LogSubcommand};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::constants::DATE_FORMAT_DATE_ONLY;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::{
    current_timestamp, generate_id, parse_date_bound, parse_duration_seconds, parse_iso_or_rfc3339,
};
use crate::persistence::Persistence;
use crate::types::{AuditSource, NewTimeLog, TimeLogUpdateHistory};
use chrono::{DateTime, Duration, Utc};
use std::collections::HashSet;

struct LogListCriteria {
    task: Option<String>,
    project: Option<String>,
    today: bool,
    week: bool,
    month: bool,
    from: Option<String>,
    to: Option<String>,
    limit: Option<usize>,
}

struct LogAddInput {
    target: String,
    duration: Option<String>,
    note: Option<String>,
    from: Option<String>,
    to: Option<String>,
    explicit_note: Option<String>,
}

struct LogEditInput {
    id: String,
    duration: Option<String>,
    note: Option<String>,
    start: Option<String>,
    end: Option<String>,
    task: Option<String>,
}

struct LogFilterCriteria<'a> {
    filter_task_id: Option<&'a str>,
    allowed_task_ids: Option<&'a HashSet<String>>,
    today: bool,
    week: bool,
    month: bool,
    from_bound: Option<DateTime<Utc>>,
    to_bound: Option<DateTime<Utc>>,
    limit: Option<usize>,
}

pub fn handle(
    args: LogArgs,
    is_machine: bool,
    is_quiet: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    match args.command {
        LogSubcommand::List {
            task,
            project,
            today,
            week,
            month,
            from,
            to,
            limit,
        } => list_logs(
            persistence,
            LogListCriteria {
                task,
                project,
                today,
                week,
                month,
                from,
                to,
                limit,
            },
            is_machine,
            is_quiet,
        ),
        LogSubcommand::Add {
            target,
            duration,
            note,
            from,
            to,
            explicit_note,
        } => add_log(
            persistence,
            LogAddInput {
                target,
                duration,
                note,
                from,
                to,
                explicit_note,
            },
            is_machine,
        ),
        LogSubcommand::Edit {
            id,
            duration,
            note,
            start,
            end,
            task,
        } => edit_log(
            persistence,
            LogEditInput {
                id,
                duration,
                note,
                start,
                end,
                task,
            },
            is_machine,
        ),
        LogSubcommand::Remove { id } => remove_log(persistence, &id, is_machine),
    }
}

fn list_logs(
    persistence: &Persistence,
    criteria: LogListCriteria,
    is_machine: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    let filter_task_id = resolve_task_filter(persistence, criteria.task, is_machine)?;
    let filter_project_task_ids =
        resolve_project_filter(persistence, criteria.project, is_machine)?;

    let from_bound = criteria
        .from
        .as_deref()
        .map(|f| parse_date_bound(f, false))
        .transpose()?;
    let to_bound = criteria
        .to
        .as_deref()
        .map(|t| parse_date_bound(t, true))
        .transpose()?;

    if let (Some(f), Some(t)) = (from_bound, to_bound) {
        if f > t {
            return Err(CliError::business_custom(
                "Filter start date cannot be after end date.",
            ));
        }
    }

    let all_logs = persistence.time_logs.get_all()?;
    let tasks = persistence.tasks.get_all()?;

    let filter_criteria = LogFilterCriteria {
        filter_task_id: filter_task_id.as_deref(),
        allowed_task_ids: filter_project_task_ids.as_ref(),
        today: criteria.today,
        week: criteria.week,
        month: criteria.month,
        from_bound,
        to_bound,
        limit: criteria.limit,
    };

    let filtered = filter_and_sort_logs(all_logs, filter_criteria);

    if is_machine {
        let json_str = serde_json::to_string_pretty(&filtered)?;
        return Ok(CliOutput::Json(json_str));
    }
    if filtered.is_empty() {
        return Ok(CliOutput::Success(MSG_NO_LOGS_FOUND.to_string()));
    }

    Ok(CliOutput::Success(render_logs_table(
        &filtered, &tasks, is_quiet,
    )))
}

fn resolve_task_filter(
    persistence: &Persistence,
    task: Option<String>,
    is_machine: bool,
) -> Result<Option<String>, CliError> {
    match task {
        Some(target) => {
            let resolver = EntityResolver::with_mode(persistence, is_machine);
            let t = resolver.resolve_task(&target)?;
            Ok(Some(t.id))
        }
        None => Ok(None),
    }
}

fn resolve_project_filter(
    persistence: &Persistence,
    project: Option<String>,
    is_machine: bool,
) -> Result<Option<HashSet<String>>, CliError> {
    match project {
        Some(target) => {
            let resolver = EntityResolver::with_mode(persistence, is_machine);
            let proj = resolver.resolve_project(&target)?;
            let tasks = persistence.tasks.get_all()?;
            let task_ids: HashSet<String> = tasks
                .into_iter()
                .filter(|t| t.project_id == proj.id)
                .map(|t| t.id)
                .collect();
            Ok(Some(task_ids))
        }
        None => Ok(None),
    }
}

fn parse_log_timestamp(raw: &str) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(raw)
        .map(|dt| dt.with_timezone(&Utc))
        .ok()
        .or_else(|| {
            chrono::NaiveDateTime::parse_from_str(raw, "%Y-%m-%dT%H:%M:%S")
                .ok()
                .map(|ndt| DateTime::<Utc>::from_naive_utc_and_offset(ndt, Utc))
        })
}

fn is_log_before(start_time: &str, bound: DateTime<Utc>) -> bool {
    parse_log_timestamp(start_time)
        .map(|st| st < bound)
        .unwrap_or(false)
}

fn is_log_after(start_time: &str, bound: DateTime<Utc>) -> bool {
    parse_log_timestamp(start_time)
        .map(|st| st > bound)
        .unwrap_or(false)
}

fn filter_and_sort_logs(
    logs: Vec<crate::types::TimeLog>,
    criteria: LogFilterCriteria<'_>,
) -> Vec<crate::types::TimeLog> {
    let now = Utc::now();
    let today_prefix = now.format(DATE_FORMAT_DATE_ONLY).to_string();
    let month_prefix = now.format("%Y-%m").to_string();
    let week_start = now - Duration::days(7);

    let mut filtered: Vec<_> = logs
        .into_iter()
        .filter(|l| {
            if let Some(tid) = criteria.filter_task_id {
                if l.task_id != tid {
                    return false;
                }
            }
            if let Some(task_ids) = criteria.allowed_task_ids {
                if !task_ids.contains(&l.task_id) {
                    return false;
                }
            }
            if criteria.today && !l.start_time.starts_with(&today_prefix) {
                return false;
            }
            if criteria.month && !l.start_time.starts_with(&month_prefix) {
                return false;
            }
            if criteria.week && is_log_before(&l.start_time, week_start) {
                return false;
            }
            if let Some(from_dt) = criteria.from_bound {
                if is_log_before(&l.start_time, from_dt) {
                    return false;
                }
            }
            if let Some(to_dt) = criteria.to_bound {
                if is_log_after(&l.start_time, to_dt) {
                    return false;
                }
            }
            true
        })
        .collect();

    filtered.sort_by(|a, b| b.start_time.cmp(&a.start_time));
    filtered.truncate(criteria.limit.unwrap_or(20));
    filtered
}

fn format_log_duration(start_time: &str, end_time: Option<&str>) -> String {
    match end_time {
        Some(end) => {
            let s = DateTime::parse_from_rfc3339(start_time).ok();
            let e = DateTime::parse_from_rfc3339(end).ok();
            match (s, e) {
                (Some(s), Some(e)) => {
                    let secs = (e - s).num_seconds().max(0);
                    FORMAT_DURATION_MINS_SECS
                        .replacen("{}", &(secs / 60).to_string(), 1)
                        .replacen("{}", &(secs % 60).to_string(), 1)
                }
                _ => LABEL_INVALID_DURATION.to_string(),
            }
        }
        None => LABEL_ACTIVE_TIMER.to_string(),
    }
}

fn render_logs_table(
    logs: &[crate::types::TimeLog],
    tasks: &[crate::types::Task],
    is_quiet: bool,
) -> String {
    let mut out = if is_quiet {
        String::new()
    } else {
        String::from(HEADER_TIME_LOGS)
    };
    for log in logs {
        let task_name = tasks
            .iter()
            .find(|t| t.id == log.task_id)
            .map(|t| t.name.as_str())
            .unwrap_or(LABEL_UNKNOWN_TASK);

        let dur_str = format_log_duration(&log.start_time, log.end_time.as_deref());
        let note_display = log
            .note
            .as_deref()
            .map(|n| FORMAT_LOG_NOTE.replace("{}", n))
            .unwrap_or_default();

        let date_prefix: String = log.start_time.chars().take(19).collect();
        out.push_str(
            &FORMAT_LOG_ROW
                .replacen("{}", &date_prefix, 1)
                .replacen("{}", task_name, 1)
                .replacen("{}", &dur_str, 1)
                .replacen("{}", &log.id, 1)
                .replacen("{}", &note_display, 1),
        );
    }
    out
}

fn add_log(
    persistence: &Persistence,
    input: LogAddInput,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    let resolver = EntityResolver::with_mode(persistence, is_machine);
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
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": id,
                "action": "created"
            })
            .to_string(),
        ));
    }

    let dur_display = format_log_duration(&new_log.start_time, new_log.end_time.as_deref());
    Ok(CliOutput::Success(
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

fn edit_log(
    persistence: &Persistence,
    input: LogEditInput,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    if input.duration.is_none()
        && input.note.is_none()
        && input.start.is_none()
        && input.end.is_none()
        && input.task.is_none()
    {
        return Err(CliError::syntax_invalid_args(ERR_LOG_EDIT_EMPTY));
    }

    let existing = persistence.time_logs.get_by_id(&input.id)?;

    let target_task_id = match input.task {
        Some(ref target) => {
            let resolver = EntityResolver::with_mode(persistence, is_machine);
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

    if let Some(ref et) = new_end {
        let st_dt = parse_iso_or_rfc3339(&new_start)?;
        let et_dt = parse_iso_or_rfc3339(et)?;
        if st_dt > et_dt {
            return Err(CliError::business_custom(
                "Log start time cannot be after end time.",
            ));
        }
    }

    let new_note = input.note.as_deref().or(existing.note.as_deref());
    let history_id = generate_id();
    let now = current_timestamp();

    let history_entry = TimeLogUpdateHistory {
        id: &existing.id,
        task_id: &target_task_id,
        start_time: &new_start,
        end_time: new_end.as_deref(),
        note: new_note,
        history_id: &history_id,
        edited_at: &now,
        prev_start_time: Some(&existing.start_time),
        prev_end_time: existing.end_time.as_deref(),
        prev_note: existing.note.as_deref(),
        reason: Some(AuditSource::CliEdit),
    };

    persistence.time_logs.update_with_history(&history_entry)?;

    if is_machine {
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": input.id,
                "action": "updated"
            })
            .to_string(),
        ));
    }

    Ok(CliOutput::Success(MSG_LOG_UPDATED.replace("{}", &input.id)))
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

fn remove_log(
    persistence: &Persistence,
    id: &str,
    is_machine: bool,
) -> Result<CliOutput, CliError> {
    persistence.time_logs.delete(id)?;
    if is_machine {
        return Ok(CliOutput::Json(
            serde_json::json!({
                "status": "ok",
                "id": id,
                "action": "removed"
            })
            .to_string(),
        ));
    }
    Ok(CliOutput::Success(MSG_LOG_DELETED.replace("{}", id)))
}
