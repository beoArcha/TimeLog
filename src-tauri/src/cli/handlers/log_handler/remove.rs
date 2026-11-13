use crate::cli::error::CliError;
use crate::cli::formatters::format_human_duration;
use crate::cli::handlers::constants::{
    LABEL_INVALID_DURATION, LABEL_UNKNOWN_TASK, MSG_LOG_DELETED, MSG_LOG_REMOVE_CANCELLED,
    PROMPT_CONFIRM_LOG_REMOVE,
};
use crate::cli::resolver::constants::MIN_MACHINE_PREFIX_LEN;
use crate::cli::resolver::Prompter;
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::persistence::Persistence;
use crate::types::{EntityAction, LogRemovePayload, TimeLog};
use chrono::{DateTime, Utc};

const SCHEMA_LOG_REMOVE: EnvelopeSchema = EnvelopeSchema::new("oxy.log.remove", 1);

/// How `log rm` was invoked; it decides whether to ask and what to print.
#[derive(Debug, Clone, Copy)]
pub struct RemoveLogMode {
    pub yes: bool,
    pub is_machine: bool,
    pub is_quiet: bool,
}

pub fn remove_log(
    persistence: &Persistence,
    id: &str,
    mode: RemoveLogMode,
    prompter: &dyn Prompter,
) -> Result<CliOutput, CliError> {
    let RemoveLogMode {
        yes,
        is_machine,
        is_quiet,
    } = mode;
    let log = persistence.time_logs.get_by_id(id)?;

    if should_confirm_removal(yes, is_machine, prompter) {
        let task_name = fetch_task_name(persistence, &log.task_id)?;
        let dur_display = calculate_and_format_log_duration(&log);
        let short_id: String = log.id.chars().take(MIN_MACHINE_PREFIX_LEN).collect();
        let prompt_text = PROMPT_CONFIRM_LOG_REMOVE
            .replacen("{}", &short_id, 1)
            .replacen("{}", &dur_display, 1)
            .replacen("{}", &task_name, 1);

        if !prompter.prompt_confirm(&prompt_text) {
            return Ok(CliOutput::Success(MSG_LOG_REMOVE_CANCELLED.to_string()));
        }
    }

    persistence.time_logs.delete(id)?;
    if is_machine {
        return CliOutput::envelope(
            SCHEMA_LOG_REMOVE,
            &LogRemovePayload {
                id: log.id.clone(),
                action: EntityAction::Removed,
                entry: log,
            },
        );
    }
    Ok(CliOutput::mutation(
        is_quiet,
        id,
        MSG_LOG_DELETED.replace("{}", id),
    ))
}

fn should_confirm_removal(yes: bool, is_machine: bool, prompter: &dyn Prompter) -> bool {
    !yes && !is_machine && prompter.is_terminal()
}

/// A deleted task only degrades the prompt label; a storage failure must still surface.
fn fetch_task_name(persistence: &Persistence, task_id: &str) -> Result<String, CliError> {
    Ok(persistence
        .tasks
        .get(task_id)?
        .map_or_else(|| LABEL_UNKNOWN_TASK.to_string(), |task| task.name))
}

fn calculate_and_format_log_duration(log: &TimeLog) -> String {
    let start_dt = match DateTime::parse_from_rfc3339(&log.start_time) {
        Ok(dt) => dt.with_timezone(&Utc),
        Err(_) => return LABEL_INVALID_DURATION.to_string(),
    };
    let end_dt = match &log.end_time {
        Some(end_str) => match DateTime::parse_from_rfc3339(end_str) {
            Ok(dt) => dt.with_timezone(&Utc),
            Err(_) => return LABEL_INVALID_DURATION.to_string(),
        },
        None => Utc::now(),
    };
    let secs = (end_dt - start_dt).num_seconds().max(0) as u64;
    format_human_duration(secs)
}
