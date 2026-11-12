use super::constants::{
    DASHBOARD_TIP_FOOTER, DIVIDER_LINE, ERR_MULTIPLE_TIMERS_SPECIFY_ALL, FORMAT_DASHBOARD_ACTIVE,
    FORMAT_DASHBOARD_PROGRESS, FORMAT_DASHBOARD_RECENT_ITEM, FORMAT_TODAY_ITEM, FORMAT_TODAY_TOTAL,
    HEADER_DASHBOARD, HEADER_TODAY_PREFIX, LABEL_GENERAL_PROJECT, LABEL_UNKNOWN_PROJECT,
    LABEL_UNKNOWN_TASK, MSG_NO_TODAY_LOGS, OUT_ALREADY_TRACKING, OUT_NOTHING_TO_STOP, OUT_STARTED,
    OUT_STOPPED_TASK_LINE, SECTION_ACTIVE_SESSION, SECTION_RECENT_ACTIVITY, SECTION_TODAY_PROGRESS,
    STATUS_ACTIVE_NOTICE, STATUS_IDLE_NOTICE, STATUS_IDLE_TIP,
};
use crate::cli::error::{CliError, CliSyntaxError};
use crate::cli::formatters::format_duration;
use crate::cli::parser::tier1_flow::{StartArgs, StopArgs, SwitchArgs};
use crate::cli::resolver::{
    constants::PROMPT_ENTER_TASK_TARGET, EntityResolver, Prompter, TerminalPrompter,
};
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::range_bounds::RangeBounds;
use crate::cli::shared::validation::validate_id;
use crate::engine::{Engine, StartOutcome};
use crate::persistence::Persistence;
use crate::types::{
    FlowAction, Project, RangePreset, RangeRequest, StartPayload, StatusPayload, StopPayload,
    SwitchPayload, Task, TimeLog,
};
use serde::{Deserialize, Serialize};

const SCHEMA_START: EnvelopeSchema = EnvelopeSchema::new("oxy.start", 1);
const SCHEMA_STOP: EnvelopeSchema = EnvelopeSchema::new("oxy.stop", 1);
const SCHEMA_SWITCH: EnvelopeSchema = EnvelopeSchema::new("oxy.switch", 1);
const SCHEMA_STATUS: EnvelopeSchema = EnvelopeSchema::new("oxy.status", 1);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RecentTaskDto {
    pub task_id: String,
    pub task_name: String,
    pub project_name: String,
    pub duration_seconds: u64,
    pub duration_formatted: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ActiveSessionDto {
    pub task_id: String,
    pub task_name: String,
    pub project_name: String,
    pub elapsed_seconds: u64,
    pub elapsed_formatted: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DashboardDto {
    pub running: bool,
    pub active_session: Option<ActiveSessionDto>,
    pub today_date: String,
    pub today_total_seconds: u64,
    pub today_total_formatted: String,
    pub session_count: usize,
    pub recent_tasks: Vec<RecentTaskDto>,
}

pub fn handle_start(
    args: StartArgs,
    is_machine: bool,
    is_quiet: bool,
    strict: bool,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    handle_start_with_prompter(
        args,
        is_machine,
        is_quiet,
        strict,
        persistence,
        engine,
        &TerminalPrompter::new(strict),
    )
}

pub fn handle_start_interactive(
    args: StartArgs,
    persistence: &Persistence,
    engine: &Engine,
    prompter: &dyn Prompter,
) -> Result<CliOutput, CliError> {
    handle_start_with_prompter(args, false, false, false, persistence, engine, prompter)
}

pub fn handle_start_with_prompter(
    args: StartArgs,
    is_machine: bool,
    is_quiet: bool,
    strict: bool,
    persistence: &Persistence,
    engine: &Engine,
    prompter: &dyn Prompter,
) -> Result<CliOutput, CliError> {
    let target = match args.target {
        Some(t) => {
            validate_id(&t)?;
            t
        }
        None => {
            let active = engine.get_active_logs()?;
            if !active.is_empty() {
                if is_machine {
                    return status_envelope(active);
                }
                return Ok(CliOutput::Status(active));
            }

            if !prompter.is_terminal() {
                return Err(CliError::Syntax(CliSyntaxError::MissingTarget));
            }

            prompter
                .prompt_input(PROMPT_ENTER_TASK_TARGET)
                .filter(|s| !s.trim().is_empty())
                .ok_or(CliError::Syntax(CliSyntaxError::MissingTarget))?
        }
    };

    let resolver = EntityResolver::with_mode(persistence, strict);
    let task = resolver.resolve_task_interactive(&target, prompter)?;

    let outcome = engine.start_timer(&task.id)?;
    render_start_outcome(outcome, &task, is_machine, is_quiet, persistence)
}

fn render_start_outcome(
    outcome: StartOutcome,
    task: &Task,
    is_machine: bool,
    is_quiet: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    match outcome {
        StartOutcome::AlreadyRunning if is_machine => CliOutput::envelope(
            SCHEMA_START,
            &StartPayload {
                action: FlowAction::AlreadyRunning,
                task_id: task.id.clone(),
                time_log_id: None,
                stopped_task_ids: Vec::new(),
            },
        ),
        // No entity is created, so a quiet caller capturing an identifier gets nothing to capture.
        StartOutcome::AlreadyRunning if is_quiet => Ok(CliOutput::Raw(String::new())),
        StartOutcome::AlreadyRunning => Ok(CliOutput::Raw(
            OUT_ALREADY_TRACKING
                .replacen("{}", &task.name, 1)
                .replacen("{}", &task.id, 1),
        )),
        StartOutcome::Started {
            stopped_task_ids,
            time_log_id,
        } if is_machine => CliOutput::envelope(
            SCHEMA_START,
            &StartPayload {
                action: FlowAction::Started,
                task_id: task.id.clone(),
                time_log_id: Some(time_log_id),
                stopped_task_ids,
            },
        ),
        StartOutcome::Started { time_log_id, .. } if is_quiet => Ok(CliOutput::Id(time_log_id)),
        StartOutcome::Started {
            stopped_task_ids, ..
        } if stopped_task_ids.is_empty() => Ok(CliOutput::Started(task.id.clone())),
        StartOutcome::Started {
            stopped_task_ids, ..
        } => {
            let mut text = OUT_STARTED.replace("{}", &task.id);
            for stopped_id in &stopped_task_ids {
                let name = persistence
                    .tasks
                    .get(stopped_id)?
                    .map(|t| t.name)
                    .unwrap_or_else(|| LABEL_UNKNOWN_TASK.to_string());
                text.push('\n');
                text.push_str(
                    &OUT_STOPPED_TASK_LINE
                        .replacen("{}", &name, 1)
                        .replacen("{}", stopped_id, 1),
                );
            }
            Ok(CliOutput::Raw(text))
        }
    }
}

pub fn handle_stop(
    args: StopArgs,
    is_machine: bool,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    let active = engine.get_active_logs()?;
    if active.is_empty() {
        if args.if_running {
            return nothing_to_stop_output(is_machine);
        }
        return Err(crate::engine::EngineError::NoActiveTimer.into());
    }
    if active.len() > 1 && !args.all {
        return Err(CliError::business_custom(
            ERR_MULTIPLE_TIMERS_SPECIFY_ALL.replace("{}", &active.len().to_string()),
        ));
    }

    let stopped_count = active.len();
    engine.stop_timer(None)?;
    if is_machine {
        return CliOutput::envelope(
            SCHEMA_STOP,
            &StopPayload {
                action: FlowAction::Stopped,
                stopped_count: stopped_count as u32,
            },
        );
    }
    Ok(CliOutput::Stopped)
}

fn nothing_to_stop_output(is_machine: bool) -> Result<CliOutput, CliError> {
    if is_machine {
        return CliOutput::envelope(
            SCHEMA_STOP,
            &StopPayload {
                action: FlowAction::Noop,
                stopped_count: 0,
            },
        );
    }
    Ok(CliOutput::Success(OUT_NOTHING_TO_STOP.to_string()))
}

pub fn handle_switch(
    args: SwitchArgs,
    is_machine: bool,
    is_quiet: bool,
    strict: bool,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    handle_switch_with_prompter(
        args,
        is_machine,
        is_quiet,
        strict,
        persistence,
        engine,
        &TerminalPrompter::new(strict),
    )
}

pub fn handle_switch_interactive(
    args: SwitchArgs,
    persistence: &Persistence,
    engine: &Engine,
    prompter: &dyn Prompter,
) -> Result<CliOutput, CliError> {
    handle_switch_with_prompter(args, false, false, false, persistence, engine, prompter)
}

pub fn handle_switch_with_prompter(
    args: SwitchArgs,
    is_machine: bool,
    is_quiet: bool,
    strict: bool,
    persistence: &Persistence,
    engine: &Engine,
    prompter: &dyn Prompter,
) -> Result<CliOutput, CliError> {
    validate_id(&args.target)?;
    let resolver = EntityResolver::with_mode(persistence, strict);
    let task = resolver.resolve_task_interactive(&args.target, prompter)?;

    let time_log_id = engine.switch_timer(&task.id)?;
    if is_machine {
        return CliOutput::envelope(
            SCHEMA_SWITCH,
            &SwitchPayload {
                action: FlowAction::Switched,
                task_id: task.id,
                time_log_id,
            },
        );
    }
    if is_quiet {
        return Ok(CliOutput::Id(time_log_id));
    }
    Ok(CliOutput::Started(task.id))
}

pub fn handle_status(is_machine: bool, engine: &Engine) -> Result<CliOutput, CliError> {
    let active = engine.get_active_logs()?;
    if is_machine {
        return status_envelope(active);
    }
    Ok(CliOutput::Status(active))
}

fn status_envelope(active_task_ids: Vec<String>) -> Result<CliOutput, CliError> {
    CliOutput::envelope(
        SCHEMA_STATUS,
        &StatusPayload {
            count: active_task_ids.len() as u32,
            running: !active_task_ids.is_empty(),
            active_task_ids,
        },
    )
}

fn resolve_today_bounds(
    engine: &Engine,
    tz: Option<&str>,
) -> Result<(String, RangeBounds), CliError> {
    let range_request = RangeRequest {
        preset: Some(RangePreset::Today),
        from: None,
        to: None,
        timezone: tz.map(str::to_string),
    };
    let resolved = engine.resolve_range(&range_request)?;
    let local_date = engine.local_date_of_range(&resolved)?;
    Ok((local_date, RangeBounds::from_resolved(&resolved)?))
}

pub fn handle_today(
    is_machine: bool,
    persistence: &Persistence,
    engine: &Engine,
    tz: Option<&str>,
) -> Result<CliOutput, CliError> {
    let (today_date, bounds) = resolve_today_bounds(engine, tz)?;
    let logs = persistence.time_logs.get_all()?;
    let tasks = persistence.tasks.get_all()?;
    let projects = persistence.projects.get_all()?;

    let today_logs: Vec<_> = logs
        .into_iter()
        .filter(|l| bounds.contains(&l.start_time))
        .collect();

    if is_machine {
        let mut total_secs: i64 = 0;
        let mut entries: Vec<serde_json::Value> = Vec::new();
        for l in &today_logs {
            let dur = calculate_log_duration_secs(l)?;
            total_secs += dur;
            entries.push(serde_json::json!({
                "id": l.id,
                "task_id": l.task_id,
                "start_time": l.start_time,
                "end_time": l.end_time,
                "duration_seconds": dur
            }));
        }
        let json = serde_json::json!({
            "date": today_date,
            "total_seconds": total_secs,
            "entries": entries
        });
        return Ok(CliOutput::Json(json.to_string()));
    }

    Ok(CliOutput::Success(format_daily_summary(
        &today_logs,
        &tasks,
        &projects,
        &today_date,
    )?))
}

pub fn handle_glance(
    is_machine: bool,
    persistence: &Persistence,
    engine: &Engine,
    tz: Option<&str>,
) -> Result<CliOutput, CliError> {
    let dto = build_dashboard_dto(persistence, engine, tz)?;

    if is_machine {
        let json = serde_json::to_string_pretty(&dto)?;
        return Ok(CliOutput::Json(json));
    }

    Ok(CliOutput::Success(render_dashboard_card(&dto)))
}

pub fn build_dashboard_dto(
    persistence: &Persistence,
    engine: &Engine,
    tz: Option<&str>,
) -> Result<DashboardDto, CliError> {
    let active_ids = engine.get_active_logs()?;
    let tasks = persistence.tasks.get_all()?;
    let projects = persistence.projects.get_all()?;
    let logs = persistence.time_logs.get_all()?;

    let active_session = match active_ids.first() {
        Some(active_id) => {
            let task_name = tasks
                .iter()
                .find(|t| t.id == *active_id)
                .map(|t| t.name.as_str())
                .unwrap_or(LABEL_UNKNOWN_TASK);
            let project_name = tasks
                .iter()
                .find(|t| t.id == *active_id)
                .and_then(|t| projects.iter().find(|p| p.id == t.project_id))
                .map(|p| p.name.as_str())
                .unwrap_or(LABEL_GENERAL_PROJECT);

            let active_log = logs
                .iter()
                .find(|l| l.end_time.is_none() && l.task_id == *active_id);
            let elapsed_seconds = match active_log {
                Some(log) => calculate_log_duration_secs(log)? as u64,
                None => 0,
            };

            Some(ActiveSessionDto {
                task_id: active_id.clone(),
                task_name: task_name.to_string(),
                project_name: project_name.to_string(),
                elapsed_seconds,
                elapsed_formatted: format_duration(elapsed_seconds),
            })
        }
        None => None,
    };

    let (today_date, bounds) = resolve_today_bounds(engine, tz)?;
    let mut today_logs: Vec<_> = logs
        .into_iter()
        .filter(|l| bounds.contains(&l.start_time))
        .collect();

    let mut today_total_seconds: u64 = 0;
    for l in &today_logs {
        today_total_seconds += calculate_log_duration_secs(l)? as u64;
    }
    let session_count = today_logs.len();

    today_logs.sort_by(|a, b| b.start_time.cmp(&a.start_time));
    let mut recent_tasks = Vec::new();
    for log in today_logs.into_iter().take(3) {
        let task_name = tasks
            .iter()
            .find(|t| t.id == log.task_id)
            .map(|t| t.name.as_str())
            .unwrap_or(LABEL_UNKNOWN_TASK);
        let project_name = tasks
            .iter()
            .find(|t| t.id == log.task_id)
            .and_then(|t| projects.iter().find(|p| p.id == t.project_id))
            .map(|p| p.name.as_str())
            .unwrap_or(LABEL_UNKNOWN_PROJECT);
        let dur = calculate_log_duration_secs(&log)? as u64;

        recent_tasks.push(RecentTaskDto {
            task_id: log.task_id,
            task_name: task_name.to_string(),
            project_name: project_name.to_string(),
            duration_seconds: dur,
            duration_formatted: format_duration(dur),
        });
    }

    Ok(DashboardDto {
        running: active_session.is_some(),
        active_session,
        today_date,
        today_total_seconds,
        today_total_formatted: format_duration(today_total_seconds),
        session_count,
        recent_tasks,
    })
}

fn render_dashboard_card(dto: &DashboardDto) -> String {
    let active_card = render_active_session_card(dto.active_session.as_ref());
    let progress_card = render_today_progress_card(&dto.today_total_formatted, dto.session_count);
    let recents_card = render_recent_activity_card(&dto.recent_tasks);

    format!(
        "{}{}{}{}{}",
        HEADER_DASHBOARD, active_card, progress_card, recents_card, DASHBOARD_TIP_FOOTER
    )
}

fn render_active_session_card(session: Option<&ActiveSessionDto>) -> String {
    let mut out = String::from(SECTION_ACTIVE_SESSION);
    match session {
        Some(s) => {
            out.push_str(STATUS_ACTIVE_NOTICE);
            let row = FORMAT_DASHBOARD_ACTIVE
                .replacen("{}", &s.task_name, 1)
                .replacen("{}", &s.task_id, 1)
                .replacen("{}", &s.project_name, 1)
                .replacen("{}", &s.elapsed_formatted, 1);
            out.push_str(&row);
        }
        None => {
            out.push_str(STATUS_IDLE_NOTICE);
            out.push_str(STATUS_IDLE_TIP);
        }
    }
    out
}

fn render_today_progress_card(today_total: &str, session_count: usize) -> String {
    let mut out = String::from(SECTION_TODAY_PROGRESS);
    let progress_row = FORMAT_DASHBOARD_PROGRESS
        .replacen("{}", today_total, 1)
        .replacen("{}", &session_count.to_string(), 1);
    out.push_str(&progress_row);
    out
}

fn render_recent_activity_card(recent_tasks: &[RecentTaskDto]) -> String {
    let mut out = String::from(SECTION_RECENT_ACTIVITY);
    if recent_tasks.is_empty() {
        out.push_str(MSG_NO_TODAY_LOGS);
        return out;
    }

    let rows: String = recent_tasks
        .iter()
        .map(|recent| {
            FORMAT_DASHBOARD_RECENT_ITEM
                .replacen("{}", &recent.task_name, 1)
                .replacen("{}", &recent.project_name, 1)
                .replacen("{}", &recent.duration_formatted, 1)
        })
        .collect();
    out.push_str(&rows);
    out
}

fn format_daily_summary(
    today_logs: &[TimeLog],
    tasks: &[Task],
    projects: &[Project],
    today_prefix: &str,
) -> Result<String, CliError> {
    let mut output = HEADER_TODAY_PREFIX.replace("{}", today_prefix);

    if today_logs.is_empty() {
        output.push_str(MSG_NO_TODAY_LOGS);
        return Ok(output);
    }

    let mut total_today_secs: i64 = 0;
    for log in today_logs {
        let dur = calculate_log_duration_secs(log)?;
        total_today_secs += dur;

        let task_name = tasks
            .iter()
            .find(|t| t.id == log.task_id)
            .map(|t| t.name.as_str())
            .unwrap_or(LABEL_UNKNOWN_TASK);
        let proj_name = tasks
            .iter()
            .find(|t| t.id == log.task_id)
            .and_then(|t| projects.iter().find(|p| p.id == t.project_id))
            .map(|p| p.name.as_str())
            .unwrap_or(LABEL_GENERAL_PROJECT);

        let mins_str = format!("{:02}", dur / 60);
        let secs_str = format!("{:02}", dur % 60);
        output.push_str(
            &FORMAT_TODAY_ITEM
                .replacen("{}", proj_name, 1)
                .replacen("{}", task_name, 1)
                .replacen("{}", &mins_str, 1)
                .replacen("{}", &secs_str, 1),
        );
    }

    let total_hrs = total_today_secs / 3600;
    let total_mins_str = format!("{:02}", (total_today_secs % 3600) / 60);
    output.push_str(DIVIDER_LINE);
    output.push_str(
        &FORMAT_TODAY_TOTAL
            .replacen("{}", &total_hrs.to_string(), 1)
            .replacen("{}", &total_mins_str, 1)
            .replacen("{}", &today_logs.len().to_string(), 1),
    );

    Ok(output)
}

fn calculate_log_duration_secs(log: &TimeLog) -> Result<i64, CliError> {
    let dur = Engine::calculate_log_elapsed(log)?;
    Ok(dur.as_secs() as i64)
}
