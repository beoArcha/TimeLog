use chrono::{DateTime, Utc};
use chrono_tz::Tz;
use oxyflow_timelog::engine::EngineError;
use oxyflow_timelog::types::{RangePreset, RangeRequest, ResolvedRange};

pub const NOW: &str = "2026-11-11T21:30:00Z";
pub const WARSAW: Tz = Tz::Europe__Warsaw;

pub fn utc(raw: &str) -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(raw)
        .unwrap()
        .with_timezone(&Utc)
}

pub fn preset(preset: RangePreset) -> RangeRequest {
    RangeRequest {
        preset: Some(preset),
        from: None,
        to: None,
        timezone: None,
    }
}

pub fn custom(from: Option<&str>, to: Option<&str>) -> RangeRequest {
    RangeRequest {
        preset: None,
        from: from.map(str::to_string),
        to: to.map(str::to_string),
        timezone: None,
    }
}

pub fn bounds(range: &ResolvedRange) -> (Option<String>, Option<String>) {
    (range.from.clone(), range.to.clone())
}

pub fn span(from: &str, to: &str) -> (Option<String>, Option<String>) {
    (Some(from.to_string()), Some(to.to_string()))
}

pub fn is_invalid_range_input(result: Result<ResolvedRange, EngineError>) -> bool {
    matches!(result, Err(EngineError::InvalidRangeInput(_)))
}
