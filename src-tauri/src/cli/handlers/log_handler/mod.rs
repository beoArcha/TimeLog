mod add;
mod edit;
mod list;
mod remove;

use add::{add_log, LogAddInput};
use edit::{edit_log, LogEditInput};
use list::{list_logs, LogListCriteria};
pub use remove::{remove_log, RemoveLogMode};

use super::constants::{FORMAT_DURATION_MINS_SECS, LABEL_ACTIVE_TIMER, LABEL_INVALID_DURATION};
use crate::cli::error::CliError;
use crate::cli::parser::tier2_entities::{LogArgs, LogSubcommand};
use crate::cli::resolver::TerminalPrompter;
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::persistence::Persistence;
use chrono::DateTime;

pub fn handle(
    args: LogArgs,
    is_machine: bool,
    strict: bool,
    is_quiet: bool,
    persistence: &Persistence,
    engine: &Engine,
    tz: Option<&str>,
) -> Result<CliOutput, CliError> {
    match args.command {
        LogSubcommand::List {
            task,
            project,
            period,
            limit,
        } => list_logs(
            persistence,
            engine,
            LogListCriteria {
                task,
                project,
                period,
                limit,
                tz: tz.map(str::to_string),
            },
            is_machine,
            strict,
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
            strict,
            is_quiet,
        ),
        LogSubcommand::Edit {
            id,
            duration,
            note,
            start,
            end,
            task,
            reason,
        } => edit_log(
            persistence,
            LogEditInput {
                id,
                duration,
                note,
                start,
                end,
                task,
                reason,
            },
            is_machine,
            strict,
            is_quiet,
        ),
        LogSubcommand::Remove { id, yes } => remove_log(
            persistence,
            &id,
            RemoveLogMode {
                yes,
                is_machine,
                is_quiet,
            },
            &TerminalPrompter::new(strict),
        ),
    }
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
