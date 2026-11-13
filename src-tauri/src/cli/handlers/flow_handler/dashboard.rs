use super::today::{calculate_log_duration_secs, resolve_today_bounds};
use crate::cli::error::CliError;
use crate::cli::formatters::format_duration;
use crate::cli::handlers::constants::{
    DASHBOARD_TIP_FOOTER, FORMAT_DASHBOARD_ACTIVE, FORMAT_DASHBOARD_PROGRESS,
    FORMAT_DASHBOARD_RECENT_ITEM, HEADER_DASHBOARD, LABEL_GENERAL_PROJECT, LABEL_UNKNOWN_PROJECT,
    LABEL_UNKNOWN_TASK, MSG_NO_TODAY_LOGS, SECTION_ACTIVE_SESSION, SECTION_RECENT_ACTIVITY,
    SECTION_TODAY_PROGRESS, STATUS_ACTIVE_NOTICE, STATUS_IDLE_NOTICE, STATUS_IDLE_TIP,
};
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::persistence::Persistence;
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
