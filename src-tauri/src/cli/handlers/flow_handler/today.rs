use crate::cli::error::CliError;
use crate::cli::handlers::constants::{
    DIVIDER_LINE, FORMAT_TODAY_ITEM, FORMAT_TODAY_TOTAL, HEADER_TODAY_PREFIX,
    LABEL_GENERAL_PROJECT, LABEL_UNKNOWN_TASK, MSG_NO_TODAY_LOGS,
};
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::range_bounds::RangeBounds;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{Project, RangePreset, RangeRequest, Task, TimeLog};

pub(super) fn resolve_today_bounds(
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

pub(super) fn calculate_log_duration_secs(log: &TimeLog) -> Result<i64, CliError> {
    let dur = Engine::calculate_log_elapsed(log)?;
    Ok(dur.as_secs() as i64)
}
