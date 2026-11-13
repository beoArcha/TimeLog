use super::format_log_duration;
use crate::cli::error::CliError;
use crate::cli::handlers::constants::{
    FORMAT_LOG_NOTE, FORMAT_LOG_ROW, HEADER_TIME_LOGS, LABEL_UNKNOWN_TASK,
    MSG_LOGS_TRUNCATED_FOOTER, MSG_NO_LOGS_FOUND,
};
use crate::cli::parser::period_args::PeriodArgs;
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::range_bounds::RangeBounds;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::LogListPayload;
use std::collections::HashSet;

const SCHEMA_LOG_LIST: EnvelopeSchema = EnvelopeSchema::new("oxy.log.list", 1);

pub(super) struct LogListCriteria {
    pub(super) task: Option<String>,
    pub(super) project: Option<String>,
    pub(super) period: PeriodArgs,
    pub(super) limit: Option<usize>,
    pub(super) tz: Option<String>,
}

struct LogFilterCriteria<'a> {
    filter_task_id: Option<&'a str>,
    allowed_task_ids: Option<&'a HashSet<String>>,
    bounds: RangeBounds,
}

pub(super) fn list_logs(
    persistence: &Persistence,
    engine: &Engine,
    criteria: LogListCriteria,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
) -> Result<CliOutput, CliError> {
    let filter_task_id = resolve_task_filter(persistence, criteria.task, strict)?;
    let filter_project_task_ids = resolve_project_filter(persistence, criteria.project, strict)?;

    let range_request = criteria.period.to_range_request(criteria.tz.as_deref());
    let resolved = engine.resolve_range(&range_request)?;
    let bounds = RangeBounds::from_resolved(&resolved)?;

    let all_logs = persistence.time_logs.get_all()?;
    let tasks = persistence.tasks.get_all()?;

    let filter_criteria = LogFilterCriteria {
        filter_task_id: filter_task_id.as_deref(),
        allowed_task_ids: filter_project_task_ids.as_ref(),
        bounds,
    };

    let (mut filtered, total_matched) = filter_and_sort_logs(all_logs, filter_criteria);

    let effective_limit = if is_machine {
        criteria.limit
    } else {
        Some(criteria.limit.unwrap_or(20))
    };

    if let Some(lim) = effective_limit {
        filtered.truncate(lim);
    }

    if is_machine {
        return CliOutput::envelope(
            SCHEMA_LOG_LIST,
            &LogListPayload {
                items: filtered,
                total_matched: total_matched as u64,
            },
        );
    }
    if filtered.is_empty() {
        return Ok(CliOutput::empty_list(is_quiet, MSG_NO_LOGS_FOUND));
    }

    let rows = render_log_rows(&filtered, &tasks, is_quiet, total_matched);
    Ok(CliOutput::list(is_quiet, HEADER_TIME_LOGS, &rows))
}

fn resolve_task_filter(
    persistence: &Persistence,
    task: Option<String>,
    strict: bool,
) -> Result<Option<String>, CliError> {
    match task {
        Some(target) => {
            let resolver = EntityResolver::with_mode(persistence, strict);
            let t = resolver.resolve_task(&target)?;
            Ok(Some(t.id))
        }
        None => Ok(None),
    }
}

fn resolve_project_filter(
    persistence: &Persistence,
    project: Option<String>,
    strict: bool,
) -> Result<Option<HashSet<String>>, CliError> {
    match project {
        Some(target) => {
            let resolver = EntityResolver::with_mode(persistence, strict);
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

fn filter_and_sort_logs(
    logs: Vec<crate::types::TimeLog>,
    criteria: LogFilterCriteria<'_>,
) -> (Vec<crate::types::TimeLog>, usize) {
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
            criteria.bounds.contains(&l.start_time)
        })
        .collect();

    filtered.sort_by(|a, b| b.start_time.cmp(&a.start_time));
    let total_matched = filtered.len();
    (filtered, total_matched)
}

fn render_log_rows(
    logs: &[crate::types::TimeLog],
    tasks: &[crate::types::Task],
    is_quiet: bool,
    total_matched: usize,
) -> String {
    let mut out = String::new();
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
    if !is_quiet && total_matched > logs.len() {
        let not_shown = total_matched - logs.len();
        out.push_str(&MSG_LOGS_TRUNCATED_FOOTER.replacen("{}", &not_shown.to_string(), 1));
        out.push('\n');
    }
    out
}
