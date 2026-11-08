use super::constants::{
    ERR_DATE_RANGE_INVALID, PERIOD_LABEL_ALL, PERIOD_LABEL_CUSTOM, PERIOD_LABEL_MONTH,
    PERIOD_LABEL_TODAY, PERIOD_LABEL_WEEK,
};
use super::report_handler::ReportFilterCriteria;
use crate::cli::error::CliError;
use crate::cli::shared::utils::parse_date_bound;
use chrono::{Datelike, Utc};

pub fn determine_bounds(
    criteria: &ReportFilterCriteria,
) -> Result<(Option<String>, Option<String>, String), CliError> {
    if criteria.from.is_some() || criteria.to.is_some() {
        return parse_custom_range_bounds(criteria.from.as_deref(), criteria.to.as_deref());
    }

    let now = Utc::now();
    if criteria.today {
        let midnight = now
            .date_naive()
            .and_hms_opt(0, 0, 0)
            .map(|ndt| ndt.and_utc())
            .unwrap_or(now);
        return Ok((
            Some(midnight.to_rfc3339()),
            None,
            PERIOD_LABEL_TODAY.to_string(),
        ));
    }
    if criteria.week {
        let days = now.weekday().num_days_from_monday();
        let monday = (now - chrono::Duration::days(days as i64))
            .date_naive()
            .and_hms_opt(0, 0, 0)
            .map(|ndt| ndt.and_utc())
            .unwrap_or(now);
        return Ok((
            Some(monday.to_rfc3339()),
            None,
            PERIOD_LABEL_WEEK.to_string(),
        ));
    }
    if criteria.month {
        let first = chrono::NaiveDate::from_ymd_opt(now.year(), now.month(), 1)
            .and_then(|d| d.and_hms_opt(0, 0, 0))
            .map(|ndt| ndt.and_utc())
            .unwrap_or(now);
        return Ok((
            Some(first.to_rfc3339()),
            None,
            PERIOD_LABEL_MONTH.to_string(),
        ));
    }

    Ok((None, None, PERIOD_LABEL_ALL.to_string()))
}

fn parse_custom_range_bounds(
    from: Option<&str>,
    to: Option<&str>,
) -> Result<(Option<String>, Option<String>, String), CliError> {
    let from_dt = from.map(|s| parse_date_bound(s, false)).transpose()?;
    let to_dt = to.map(|s| parse_date_bound(s, true)).transpose()?;

    if let (Some(f), Some(t)) = (from_dt, to_dt) {
        if f > t {
            return Err(CliError::business_custom(ERR_DATE_RANGE_INVALID));
        }
    }

    let label = format_range_label(from, to);
    Ok((
        from_dt.map(|dt| dt.to_rfc3339()),
        to_dt.map(|dt| dt.to_rfc3339()),
        label,
    ))
}

fn format_range_label(from: Option<&str>, to: Option<&str>) -> String {
    match (from, to) {
        (Some(f), Some(t)) => format!("{} to {}", f, t),
        (Some(f), None) => format!("From {}", f),
        (None, Some(t)) => format!("Until {}", t),
        (None, None) => PERIOD_LABEL_CUSTOM.to_string(),
    }
}
