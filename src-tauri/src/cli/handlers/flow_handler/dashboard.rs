use super::status::active_sessions;
use super::today::{build_today_report, today_entries};
use crate::cli::error::CliError;
use crate::cli::formatters::format_duration;
use crate::cli::handlers::constants::{
    DASHBOARD_TIP_FOOTER, FORMAT_DASHBOARD_ACTIVE, FORMAT_DASHBOARD_PROGRESS,
    FORMAT_DASHBOARD_RECENT_ITEM, HEADER_DASHBOARD, MSG_NO_TODAY_LOGS, SECTION_ACTIVE_SESSION,
    SECTION_RECENT_ACTIVITY, SECTION_TODAY_PROGRESS, STATUS_ACTIVE_NOTICE, STATUS_IDLE_NOTICE,
    STATUS_IDLE_TIP,
};
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::persistence::Persistence;
use crate::types::{ActiveSessionPayload, DashboardPayload, RecentTaskPayload, ReportEntry};

const SCHEMA_DASHBOARD: EnvelopeSchema = EnvelopeSchema::new("oxy.dashboard", 1);
const RECENT_TASK_LIMIT: usize = 3;

pub fn handle_glance(
    is_machine: bool,
    persistence: &Persistence,
    engine: &Engine,
    tz: Option<&str>,
) -> Result<CliOutput, CliError> {
    let payload = build_dashboard_payload(persistence, engine, tz)?;

    if is_machine {
        return CliOutput::envelope(SCHEMA_DASHBOARD, &payload);
    }

    Ok(CliOutput::Success(render_dashboard_card(&payload)))
}

pub fn build_dashboard_payload(
    persistence: &Persistence,
    engine: &Engine,
    tz: Option<&str>,
) -> Result<DashboardPayload, CliError> {
    let active_session = active_sessions(persistence)?.into_iter().next();
    let document = build_today_report(engine, tz)?;

    let mut entries: Vec<&ReportEntry> = today_entries(&document).iter().collect();
    entries.sort_by(|a, b| b.start.cmp(&a.start));
    let recent_tasks = entries
        .into_iter()
        .filter_map(recent_task)
        .take(RECENT_TASK_LIMIT)
        .collect();

    Ok(DashboardPayload {
        running: active_session.is_some(),
        active_session,
        today_date: engine.local_date_of_range(&document.range)?,
        today_total_seconds: document.totals.seconds,
        session_count: document.totals.entry_count,
        recent_tasks,
    })
}

/// Only a project-level patch has no task, and the dashboard excludes patches.
fn recent_task(entry: &ReportEntry) -> Option<RecentTaskPayload> {
    Some(RecentTaskPayload {
        task_id: entry.task_id.clone()?,
        task_name: entry.task_name.clone()?,
        project_name: entry.project_name.clone(),
        duration_seconds: entry.seconds,
    })
}

fn render_dashboard_card(payload: &DashboardPayload) -> String {
    let active_card = render_active_session_card(payload.active_session.as_ref());
    let progress_card =
        render_today_progress_card(payload.today_total_seconds, payload.session_count);
    let recents_card = render_recent_activity_card(&payload.recent_tasks);

    format!(
        "{}{}{}{}{}",
        HEADER_DASHBOARD, active_card, progress_card, recents_card, DASHBOARD_TIP_FOOTER
    )
}

fn render_active_session_card(session: Option<&ActiveSessionPayload>) -> String {
    let mut out = String::from(SECTION_ACTIVE_SESSION);
    match session {
        Some(s) => {
            out.push_str(STATUS_ACTIVE_NOTICE);
            let row = FORMAT_DASHBOARD_ACTIVE
                .replacen("{}", &s.task_name, 1)
                .replacen("{}", &s.task_id, 1)
                .replacen("{}", &s.project_name, 1)
                .replacen("{}", &format_duration(s.elapsed_seconds), 1);
            out.push_str(&row);
        }
        None => {
            out.push_str(STATUS_IDLE_NOTICE);
            out.push_str(STATUS_IDLE_TIP);
        }
    }
    out
}

fn render_today_progress_card(today_total_seconds: u64, session_count: u64) -> String {
    let mut out = String::from(SECTION_TODAY_PROGRESS);
    let progress_row = FORMAT_DASHBOARD_PROGRESS
        .replacen("{}", &format_duration(today_total_seconds), 1)
        .replacen("{}", &session_count.to_string(), 1);
    out.push_str(&progress_row);
    out
}

fn render_recent_activity_card(recent_tasks: &[RecentTaskPayload]) -> String {
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
                .replacen("{}", &format_duration(recent.duration_seconds), 1)
        })
        .collect();
    out.push_str(&rows);
    out
}
