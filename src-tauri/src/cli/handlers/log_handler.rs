use super::constants::{
    FORMAT_DURATION_MINS_SECS, FORMAT_LOG_NOTE, FORMAT_LOG_ROW, HEADER_TIME_LOGS,
    LABEL_ACTIVE_TIMER, LABEL_INVALID_DURATION, LABEL_UNKNOWN_TASK, MSG_LOG_DELETED,
    MSG_LOG_RECORDED, MSG_LOG_UPDATED, MSG_NO_LOGS_FOUND,
};
use crate::cli::error::CliError;
use crate::cli::parser::tier2_entities::{LogArgs, LogSubcommand};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::constants::DATE_FORMAT_DATE_ONLY;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::{current_timestamp, generate_id, parse_duration_seconds};
use crate::persistence::Persistence;
use crate::types::{AuditSource, NewTimeLog, TimeLogUpdateHistory};
use chrono::{DateTime, Duration, Utc};

pub fn handle(args: LogArgs, persistence: &Persistence) -> Result<CliOutput, CliError> {
    match args.command {
        LogSubcommand::List {
            task,
            today,
            week,
            limit,
        } => list_logs(persistence, task, today, week, limit),
        LogSubcommand::Add {
            target,
            duration,
            note,
        } => add_log(persistence, &target, &duration, note),
        LogSubcommand::Edit { id, duration, note } => edit_log(persistence, &id, duration, note),
        LogSubcommand::Remove { id } => remove_log(persistence, &id),
    }
}

fn list_logs(
    persistence: &Persistence,
    task: Option<String>,
    today: bool,
    week: bool,
    limit: Option<usize>,
) -> Result<CliOutput, CliError> {
    let filter_task_id = resolve_task_filter(persistence, task)?;
    let all_logs = persistence
        .time_logs
        .get_all()
        .map_err(|e| CliError::Storage(e.to_string()))?;
    let tasks = persistence.tasks.get_all().unwrap_or_default();

    let filtered = filter_and_sort_logs(all_logs, filter_task_id.as_deref(), today, week, limit);
    if filtered.is_empty() {
        return Ok(CliOutput::Success(MSG_NO_LOGS_FOUND.to_string()));
    }

    Ok(CliOutput::Success(render_logs_table(&filtered, &tasks)))
}

fn resolve_task_filter(
    persistence: &Persistence,
    task: Option<String>,
) -> Result<Option<String>, CliError> {
    match task {
        Some(target) => {
            let resolver = EntityResolver::new(persistence);
            let t = resolver.resolve_task(&target)?;
            Ok(Some(t.id))
        }
        None => Ok(None),
    }
}

fn filter_and_sort_logs(
    logs: Vec<crate::types::TimeLog>,
    filter_task_id: Option<&str>,
    today: bool,
    week: bool,
    limit: Option<usize>,
) -> Vec<crate::types::TimeLog> {
    let now = Utc::now();
    let today_prefix = now.format(DATE_FORMAT_DATE_ONLY).to_string();
    let week_start = now - Duration::days(7);

    let mut filtered: Vec<_> = logs
        .into_iter()
        .filter(|l| {
            if let Some(tid) = filter_task_id {
                if l.task_id != tid {
                    return false;
                }
            }
            if today && !l.start_time.starts_with(&today_prefix) {
                return false;
            }
            if week {
                if let Ok(st) = DateTime::parse_from_rfc3339(&l.start_time) {
                    if st < week_start {
                        return false;
                    }
                }
            }
            true
        })
        .collect();

    filtered.sort_by(|a, b| b.start_time.cmp(&a.start_time));
    filtered.truncate(limit.unwrap_or(20));
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

fn render_logs_table(logs: &[crate::types::TimeLog], tasks: &[crate::types::Task]) -> String {
    let mut out = String::from(HEADER_TIME_LOGS);
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
    target: &str,
    duration: &str,
    note: Option<String>,
) -> Result<CliOutput, CliError> {
    let resolver = EntityResolver::new(persistence);
    let task = resolver.resolve_task(target)?;

    let dur_secs = parse_duration_seconds(duration)?;
    let end_dt = Utc::now();
    let start_dt = end_dt - Duration::seconds(dur_secs);
    let id = generate_id();

    let new_log = NewTimeLog {
        id: id.clone(),
        task_id: task.id.clone(),
        start_time: start_dt.to_rfc3339(),
        end_time: Some(end_dt.to_rfc3339()),
        note,
    };

    persistence
        .time_logs
        .insert_full(&new_log)
        .map_err(|e| CliError::Storage(e.to_string()))?;

    Ok(CliOutput::Success(
        MSG_LOG_RECORDED
            .replacen("{}", duration, 1)
            .replacen("{}", &task.name, 1)
            .replacen("{}", &id, 1),
    ))
}

fn edit_log(
    persistence: &Persistence,
    id: &str,
    duration: Option<String>,
    note: Option<String>,
) -> Result<CliOutput, CliError> {
    let existing = persistence
        .time_logs
        .get_by_id(id)
        .map_err(|e| CliError::Storage(e.to_string()))?;

    let new_start_time = calculate_adjusted_start_time(&existing, duration.as_deref())?;
    let new_note = note.as_deref().or(existing.note.as_deref());
    let history_id = generate_id();
    let now = current_timestamp();

    let history_entry = TimeLogUpdateHistory {
        id: &existing.id,
        task_id: &existing.task_id,
        start_time: &new_start_time,
        end_time: existing.end_time.as_deref(),
        note: new_note,
        history_id: &history_id,
        edited_at: &now,
        prev_start_time: Some(&existing.start_time),
        prev_end_time: existing.end_time.as_deref(),
        prev_note: existing.note.as_deref(),
        reason: Some(AuditSource::CliEdit),
    };

    persistence
        .time_logs
        .update_with_history(&history_entry)
        .map_err(|e| CliError::Storage(e.to_string()))?;

    Ok(CliOutput::Success(MSG_LOG_UPDATED.replace("{}", id)))
}

fn calculate_adjusted_start_time(
    existing: &crate::types::TimeLog,
    duration: Option<&str>,
) -> Result<String, CliError> {
    if let Some(dur) = duration {
        let secs = parse_duration_seconds(dur)?;
        let end = match &existing.end_time {
            Some(e) => {
                DateTime::parse_from_rfc3339(e).map_err(|e| CliError::Syntax(e.to_string()))?
            }
            None => Utc::now().fixed_offset(),
        };
        let st = end - Duration::seconds(secs);
        Ok(st.to_rfc3339())
    } else {
        Ok(existing.start_time.clone())
    }
}

fn remove_log(persistence: &Persistence, id: &str) -> Result<CliOutput, CliError> {
    persistence
        .time_logs
        .delete(id)
        .map_err(|e| CliError::Storage(e.to_string()))?;
    Ok(CliOutput::Success(MSG_LOG_DELETED.replace("{}", id)))
}
