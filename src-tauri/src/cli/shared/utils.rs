use crate::cli::shared::constants::{
    ERR_DURATION_EMPTY, ERR_DURATION_INVALID_HOURS, ERR_DURATION_INVALID_MINUTES,
    ERR_DURATION_INVALID_SECONDS, ERR_DURATION_INVALID_SEGMENT, ERR_DURATION_PARSE_FAILED,
    ERR_DURATION_UNRECOGNIZED_CHAR,
};
use chrono::Utc;
use uuid::Uuid;

pub fn generate_id() -> String {
    Uuid::new_v4().to_string()
}

pub fn current_timestamp() -> String {
    Utc::now().to_rfc3339()
}

use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DurationParseError {
    Empty,
    InvalidHours(String),
    InvalidMinutes(String),
    InvalidSeconds(String),
    UnrecognizedChar(char, String),
    InvalidSegment(String),
    ParseFailed(String),
}

impl fmt::Display for DurationParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DurationParseError::Empty => write!(f, "{}", ERR_DURATION_EMPTY),
            DurationParseError::InvalidHours(s) => {
                write!(f, "{}", ERR_DURATION_INVALID_HOURS.replace("{}", s))
            }
            DurationParseError::InvalidMinutes(s) => {
                write!(f, "{}", ERR_DURATION_INVALID_MINUTES.replace("{}", s))
            }
            DurationParseError::InvalidSeconds(s) => {
                write!(f, "{}", ERR_DURATION_INVALID_SECONDS.replace("{}", s))
            }
            DurationParseError::UnrecognizedChar(c, s) => write!(
                f,
                "{}",
                ERR_DURATION_UNRECOGNIZED_CHAR
                    .replacen("{}", &c.to_string(), 1)
                    .replacen("{}", s, 1)
            ),
            DurationParseError::InvalidSegment(s) => {
                write!(f, "{}", ERR_DURATION_INVALID_SEGMENT.replace("{}", s))
            }
            DurationParseError::ParseFailed(s) => {
                write!(f, "{}", ERR_DURATION_PARSE_FAILED.replace("{}", s))
            }
        }
    }
}

impl std::error::Error for DurationParseError {}

/// Parses human-friendly duration strings like "45m", "1h30m", "2h", "90" (defaulting to minutes) into total seconds.
pub fn parse_duration_seconds(input: &str) -> Result<i64, DurationParseError> {
    let s = input.trim().to_lowercase();
    if s.is_empty() {
        return Err(DurationParseError::Empty);
    }

    if let Ok(mins) = s.parse::<i64>() {
        return Ok(mins * 60);
    }

    let mut total_seconds: i64 = 0;
    let mut current_num = String::new();
    let mut matched = false;

    for c in s.chars() {
        if c.is_ascii_digit() {
            current_num.push(c);
        } else if c == 'h' {
            let num: i64 = current_num
                .parse()
                .map_err(|_| DurationParseError::InvalidHours(input.to_string()))?;
            total_seconds += num * 3600;
            current_num.clear();
            matched = true;
        } else if c == 'm' {
            let num: i64 = current_num
                .parse()
                .map_err(|_| DurationParseError::InvalidMinutes(input.to_string()))?;
            total_seconds += num * 60;
            current_num.clear();
            matched = true;
        } else if c == 's' {
            let num: i64 = current_num
                .parse()
                .map_err(|_| DurationParseError::InvalidSeconds(input.to_string()))?;
            total_seconds += num;
            current_num.clear();
            matched = true;
        } else if !c.is_whitespace() {
            return Err(DurationParseError::UnrecognizedChar(c, input.to_string()));
        }
    }

    if !current_num.is_empty() {
        let num: i64 = current_num
            .parse()
            .map_err(|_| DurationParseError::InvalidSegment(input.to_string()))?;
        total_seconds += num * 60;
        matched = true;
    }

    if !matched {
        return Err(DurationParseError::ParseFailed(input.to_string()));
    }

    Ok(total_seconds)
}

pub fn parse_date_bound(
    input: &str,
    is_upper_bound: bool,
) -> Result<chrono::DateTime<chrono::Utc>, crate::cli::error::CliError> {
    if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(input) {
        return Ok(dt.with_timezone(&chrono::Utc));
    }
    if let Ok(ndt) = chrono::NaiveDateTime::parse_from_str(input, "%Y-%m-%dT%H:%M:%S") {
        return Ok(chrono::DateTime::<chrono::Utc>::from_naive_utc_and_offset(
            ndt,
            chrono::Utc,
        ));
    }
    if let Ok(ndt) = chrono::NaiveDateTime::parse_from_str(input, "%Y-%m-%d %H:%M:%S") {
        return Ok(chrono::DateTime::<chrono::Utc>::from_naive_utc_and_offset(
            ndt,
            chrono::Utc,
        ));
    }
    if let Ok(nd) = chrono::NaiveDate::parse_from_str(input, "%Y-%m-%d") {
        let (h, m, s) = if is_upper_bound {
            (23, 59, 59)
        } else {
            (0, 0, 0)
        };
        let ndt = nd.and_hms_opt(h, m, s).ok_or_else(|| {
            crate::cli::error::CliError::syntax_invalid_args(
                crate::cli::shared::constants::ERR_INVALID_TIMESTAMP.replace("{}", input),
            )
        })?;
        return Ok(chrono::DateTime::<chrono::Utc>::from_naive_utc_and_offset(
            ndt,
            chrono::Utc,
        ));
    }
    Err(crate::cli::error::CliError::syntax_invalid_args(
        crate::cli::shared::constants::ERR_INVALID_TIMESTAMP.replace("{}", input),
    ))
}

pub fn parse_iso_or_rfc3339(
    input: &str,
) -> Result<chrono::DateTime<chrono::Utc>, crate::cli::error::CliError> {
    parse_date_bound(input, false)
}
