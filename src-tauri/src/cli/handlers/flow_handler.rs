use super::constants::{
    DASHBOARD_TIP_FOOTER, DIVIDER_LINE, FORMAT_DASHBOARD_ACTIVE, FORMAT_DASHBOARD_PROGRESS,
    FORMAT_DASHBOARD_RECENT_ITEM, FORMAT_TODAY_ITEM, FORMAT_TODAY_TOTAL, HEADER_DASHBOARD,
    HEADER_TODAY_PREFIX, LABEL_GENERAL_PROJECT, LABEL_UNKNOWN_PROJECT, LABEL_UNKNOWN_TASK,
    MSG_NO_TARGET_SPECIFIED, MSG_NO_TODAY_LOGS, SECTION_ACTIVE_SESSION, SECTION_RECENT_ACTIVITY,
    SECTION_TODAY_PROGRESS, STATUS_ACTIVE_NOTICE, STATUS_IDLE_NOTICE, STATUS_IDLE_TIP,
};
use crate::cli::error::CliError;
use crate::cli::formatters::format_duration;
use crate::cli::parser::tier1_flow::{StartArgs, StopArgs, SwitchArgs};
use crate::cli::resolver::{
    constants::PROMPT_ENTER_TASK_TARGET, EntityResolver, Prompter, TerminalPrompter,
};
use crate::cli::shared::constants::DATE_FORMAT_DATE_ONLY;
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{Project, Task, TimeLog};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

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
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    handle_start_interactive(args, persistence, engine, &TerminalPrompter)
}

pub fn handle_start_interactive(
    args: StartArgs,
    persistence: &Persistence,
    engine: &Engine,
    prompter: &dyn Prompter,
) -> Result<CliOutput, CliError> {
    let target = match args.target {
        Some(t) if !t.trim().is_empty() => t,
        _ => {
            let active = engine
                .get_active_logs()
                .map_err(|e| CliError::Engine(e.to_string()))?;
            if !active.is_empty() {
                return Ok(CliOutput::Status(active));
            }

            if !prompter.is_terminal() {
                return Err(CliError::Syntax(MSG_NO_TARGET_SPECIFIED.to_string()));
            }

            prompter
                .prompt_input(PROMPT_ENTER_TASK_TARGET)
                .filter(|s| !s.trim().is_empty())
                .ok_or_else(|| CliError::Syntax(MSG_NO_TARGET_SPECIFIED.to_string()))?
        }
    };

    let resolver = EntityResolver::new(persistence);
    let task = resolver.resolve_task_interactive(&target, prompter)?;

    engine
        .start_timer(&task.id)
        .map_err(|e| CliError::Engine(e.to_string()))?;
    Ok(CliOutput::Started(task.id))
}

pub fn handle_stop(_args: StopArgs, engine: &Engine) -> Result<CliOutput, CliError> {
    engine
        .stop_timer(None)
        .map_err(|e| CliError::Engine(e.to_string()))?;
    Ok(CliOutput::Stopped)
}

pub fn handle_switch(
    args: SwitchArgs,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    handle_switch_interactive(args, persistence, engine, &TerminalPrompter)
}

pub fn handle_switch_interactive(
    args: SwitchArgs,
    persistence: &Persistence,
    engine: &Engine,
    prompter: &dyn Prompter,
) -> Result<CliOutput, CliError> {
    let resolver = EntityResolver::new(persistence);
    let task = resolver.resolve_task_interactive(&args.target, prompter)?;

    let _ = engine.stop_timer(None);
    engine
        .start_timer(&task.id)
        .map_err(|e| CliError::Engine(e.to_string()))?;
    Ok(CliOutput::Started(task.id))
}

pub fn handle_status(is_machine: bool, engine: &Engine) -> Result<CliOutput, CliError> {
    let active = engine
        .get_active_logs()
        .map_err(|e| CliError::Engine(e.to_string()))?;
    if is_machine {
        let json = serde_json::json!({
            "active_tasks": active,
            "count": active.len(),
            "running": !active.is_empty()
        });
        return Ok(CliOutput::Json(json.to_string()));
    }
    Ok(CliOutput::Status(active))
}

pub fn handle_today(is_machine: bool, persistence: &Persistence) -> Result<CliOutput, CliError> {
    let today_prefix = Utc::now().format(DATE_FORMAT_DATE_ONLY).to_string();
    let logs = persistence
        .time_logs
        .get_all()
        .map_err(|e| CliError::Storage(e.to_string()))?;
    let tasks = persistence
        .tasks
        .get_all()
        .map_err(|e| CliError::Storage(e.to_string()))?;
    let projects = persistence
        .projects
        .get_all()
        .map_err(|e| CliError::Storage(e.to_string()))?;

    let today_logs: Vec<_> = logs
        .into_iter()
        .filter(|l| l.start_time.starts_with(&today_prefix))
        .collect();

    if is_machine {
        let total_secs: i64 = today_logs.iter().map(calculate_log_duration_secs).sum();
        let entries: Vec<serde_json::Value> = today_logs
            .iter()
            .map(|l| {
                serde_json::json!({
                    "id": l.id,
                    "task_id": l.task_id,
                    "start_time": l.start_time,
                    "end_time": l.end_time,
                    "duration_seconds": calculate_log_duration_secs(l)
                })
            })
            .collect();
        let json = serde_json::json!({
            "date": today_prefix,
            "total_seconds": total_secs,
            "entries": entries
        });
        return Ok(CliOutput::Json(json.to_string()));
    }

    Ok(CliOutput::Success(format_daily_summary(
        &today_logs,
        &tasks,
        &projects,
        &today_prefix,
    )))
}

pub fn handle_glance(
    is_machine: bool,
    persistence: &Persistence,
    engine: &Engine,
) -> Result<CliOutput, CliError> {
    let dto = build_dashboard_dto(persistence, engine)?;

    if is_machine {
        let json = serde_json::to_string_pretty(&dto).unwrap_or_else(|_| "{}".to_string());
        return Ok(CliOutput::Json(json));
    }

    Ok(CliOutput::Success(render_dashboard_card(&dto)))
}

pub fn build_dashboard_dto(
    persistence: &Persistence,
    engine: &Engine,
) -> Result<DashboardDto, CliError> {
    let active_ids = engine
        .get_active_logs()
        .map_err(|e| CliError::Engine(e.to_string()))?;
    let tasks = persistence
        .tasks
        .get_all()
        .map_err(|e| CliError::Storage(e.to_string()))?;
    let projects = persistence
        .projects
        .get_all()
        .map_err(|e| CliError::Storage(e.to_string()))?;
    let logs = persistence
        .time_logs
        .get_all()
        .map_err(|e| CliError::Storage(e.to_string()))?;

    let active_session = active_ids.first().map(|active_id| {
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
        let elapsed_seconds = active_log
            .map(|log| calculate_log_duration_secs(log).max(0) as u64)
            .unwrap_or(0);

        ActiveSessionDto {
            task_id: active_id.clone(),
            task_name: task_name.to_string(),
            project_name: project_name.to_string(),
            elapsed_seconds,
            elapsed_formatted: format_duration(elapsed_seconds),
        }
    });

    let today_prefix = Utc::now().format(DATE_FORMAT_DATE_ONLY).to_string();
    let mut today_logs: Vec<_> = logs
        .into_iter()
        .filter(|l| l.start_time.starts_with(&today_prefix))
        .collect();

    let today_total_seconds: u64 = today_logs
        .iter()
        .map(|l| calculate_log_duration_secs(l).max(0) as u64)
        .sum();
    let session_count = today_logs.len();

    today_logs.sort_by(|a, b| b.start_time.cmp(&a.start_time));
    let recent_tasks: Vec<RecentTaskDto> = today_logs
        .into_iter()
        .take(3)
        .map(|log| {
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
            let dur = calculate_log_duration_secs(&log).max(0) as u64;

            RecentTaskDto {
                task_id: log.task_id,
                task_name: task_name.to_string(),
                project_name: project_name.to_string(),
                duration_seconds: dur,
                duration_formatted: format_duration(dur),
            }
        })
        .collect();

    Ok(DashboardDto {
        running: active_session.is_some(),
        active_session,
        today_date: today_prefix,
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
) -> String {
    let mut output = HEADER_TODAY_PREFIX.replace("{}", today_prefix);

    if today_logs.is_empty() {
        output.push_str(MSG_NO_TODAY_LOGS);
        return output;
    }

    let mut total_today_secs: i64 = 0;
    for log in today_logs {
        let dur = calculate_log_duration_secs(log);
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

    output
}

fn calculate_log_duration_secs(log: &TimeLog) -> i64 {
    match &log.end_time {
        Some(end) => {
            let start_parsed = DateTime::parse_from_rfc3339(&log.start_time).ok();
            let end_parsed = DateTime::parse_from_rfc3339(end).ok();
            match (start_parsed, end_parsed) {
                (Some(s), Some(e)) => (e - s).num_seconds().max(0),
                _ => 0,
            }
        }
        None => {
            let start_parsed = DateTime::parse_from_rfc3339(&log.start_time).ok();
            match start_parsed {
                Some(s) => (Utc::now().fixed_offset() - s).num_seconds().max(0),
                None => 0,
            }
        }
    }
}
