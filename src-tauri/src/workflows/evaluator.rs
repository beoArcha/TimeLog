use crate::types::workflow::{
    REASON_DAILY_BOUNDARY, REASON_HOURS_LIMIT, TIME_FORMAT_HM, WARNING_LEAD_SECONDS,
    WARNING_LEAD_SECONDS_U32,
};
use crate::types::{TimeLog, WorkflowCheckResult, WorkflowConfig};
use chrono::{DateTime, Local, NaiveTime, Timelike, Utc};

pub fn evaluate_rules(
    config: &WorkflowConfig,
    active_logs: &[TimeLog],
    now: DateTime<Utc>,
) -> WorkflowCheckResult {
    if active_logs.is_empty() {
        return WorkflowCheckResult {
            stopped: false,
            reason: None,
            warning: false,
        };
    }

    let mut will_stop = false;
    let mut stop_reason = None;
    let mut will_warn = false;

    for log in active_logs {
        let start = match DateTime::parse_from_rfc3339(&log.start_time) {
            Ok(dt) => dt.with_timezone(&Utc),
            Err(_) => continue,
        };

        let elapsed_seconds = (now - start).num_seconds().max(0);

        if config.auto_stop_hours_limit_enabled && config.auto_stop_hours_limit > 0.0 {
            let limit_seconds = (config.auto_stop_hours_limit * 3600.0) as i64;
            if elapsed_seconds >= limit_seconds {
                will_stop = true;
                stop_reason = Some(REASON_HOURS_LIMIT.to_string());
                break;
            } else if config.warning_notification_enabled
                && elapsed_seconds >= (limit_seconds - WARNING_LEAD_SECONDS).max(0)
            {
                will_warn = true;
            }
        }

        let (boundary_stop, boundary_warn) = check_daily_boundary(config, start, now);
        if boundary_stop {
            will_stop = true;
            stop_reason = Some(REASON_DAILY_BOUNDARY.to_string());
            break;
        } else if boundary_warn {
            will_warn = true;
        }
    }

    WorkflowCheckResult {
        stopped: will_stop,
        reason: stop_reason,
        warning: will_warn,
    }
}

fn check_daily_boundary(
    config: &WorkflowConfig,
    start: DateTime<Utc>,
    now: DateTime<Utc>,
) -> (bool, bool) {
    if !config.auto_stop_daily_boundary_enabled
        || config.auto_stop_daily_boundary_time.trim().is_empty()
    {
        return (false, false);
    }

    let Ok(boundary_time) =
        NaiveTime::parse_from_str(config.auto_stop_daily_boundary_time.trim(), TIME_FORMAT_HM)
    else {
        return (false, false);
    };

    let now_local = now.with_timezone(&Local);
    let start_local = start.with_timezone(&Local);

    let now_seconds_of_day = now_local.time().num_seconds_from_midnight();
    let boundary_seconds_of_day = boundary_time.num_seconds_from_midnight();

    let start_date = start_local.date_naive();
    let now_date = now_local.date_naive();

    let started_before_boundary = if start_date < now_date {
        true
    } else if start_date == now_date {
        start_local.time().num_seconds_from_midnight() < boundary_seconds_of_day
    } else {
        false
    };

    let will_stop = started_before_boundary && now_seconds_of_day >= boundary_seconds_of_day;
    let will_warn = config.warning_notification_enabled
        && started_before_boundary
        && now_seconds_of_day >= boundary_seconds_of_day.saturating_sub(WARNING_LEAD_SECONDS_U32)
        && now_seconds_of_day < boundary_seconds_of_day;

    (will_stop, will_warn)
}
