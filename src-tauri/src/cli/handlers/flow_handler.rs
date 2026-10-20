use crate::cli::parser::tier1_flow::{StartArgs, StopArgs, SwitchArgs};
use crate::cli::resolver::EntityResolver;
use crate::cli::shared::constants::{
    DATE_FORMAT_DATE_ONLY, DIVIDER_LINE, FORMAT_GLANCE_TRACKING, FORMAT_TODAY_ITEM,
    FORMAT_TODAY_TOTAL, HEADER_QUICK_STATUS, HEADER_TODAY_PREFIX, LABEL_GENERAL_PROJECT,
    LABEL_UNKNOWN_TASK, MSG_NO_TARGET_SPECIFIED, MSG_NO_TODAY_LOGS, STATUS_ACTIVE_NOTICE,
    STATUS_IDLE_NOTICE, STATUS_IDLE_TIP,
};
use crate::cli::error::CliError;
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{Project, Task, TimeLog};
use chrono::{DateTime, Utc};

pub fn handle_start(
    args: StartArgs,
    persistence: &Persistence,
    engine: &Engine,
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
            return Err(CliError::Syntax(MSG_NO_TARGET_SPECIFIED.to_string()));
        }
    };

    let resolver = EntityResolver::new(persistence);
    let task = resolver.resolve_task(&target)?;

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
    let resolver = EntityResolver::new(persistence);
    let task = resolver.resolve_task(&args.target)?;

    let _ = engine.stop_timer(None);
    engine
        .start_timer(&task.id)
        .map_err(|e| CliError::Engine(e.to_string()))?;
    Ok(CliOutput::Started(task.id))
}

pub fn handle_status(engine: &Engine) -> Result<CliOutput, CliError> {
    let active = engine
        .get_active_logs()
        .map_err(|e| CliError::Engine(e.to_string()))?;
    Ok(CliOutput::Status(active))
}

pub fn handle_today(persistence: &Persistence) -> Result<CliOutput, CliError> {
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

    Ok(CliOutput::Success(format_daily_summary(
        &today_logs,
        &tasks,
        &projects,
        &today_prefix,
    )))
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

pub fn handle_glance(persistence: &Persistence, engine: &Engine) -> Result<CliOutput, CliError> {
    let active_ids = engine
        .get_active_logs()
        .map_err(|e| CliError::Engine(e.to_string()))?;
    let tasks = persistence
        .tasks
        .get_all()
        .map_err(|e| CliError::Storage(e.to_string()))?;

    Ok(CliOutput::Success(format_glance_card(&active_ids, &tasks)))
}

fn format_glance_card(active_ids: &[String], tasks: &[Task]) -> String {
    let mut output = String::from(HEADER_QUICK_STATUS);

    if active_ids.is_empty() {
        output.push_str(STATUS_IDLE_NOTICE);
        output.push_str(STATUS_IDLE_TIP);
    } else {
        output.push_str(STATUS_ACTIVE_NOTICE);
        for id in active_ids {
            let task_name = tasks
                .iter()
                .find(|t| t.id == *id)
                .map(|t| t.name.as_str())
                .unwrap_or(LABEL_UNKNOWN_TASK);
            output.push_str(
                &FORMAT_GLANCE_TRACKING
                    .replacen("{}", task_name, 1)
                    .replacen("{}", id, 1),
            );
        }
    }

    output
}
