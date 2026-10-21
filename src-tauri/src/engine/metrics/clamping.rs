use crate::engine::EngineError;
use crate::types::ClampedTimeLog;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Copy)]
pub struct IntervalInput<'a> {
    pub id: &'a str,
    pub project_id: &'a str,
    pub task_id: &'a str,
    pub start_time: &'a str,
    pub end_time: Option<&'a str>,
    pub note: Option<&'a str>,
    pub is_patch: bool,
}

pub fn clamp_interval(
    input: IntervalInput,
    range_start: Option<DateTime<Utc>>,
    range_end: Option<DateTime<Utc>>,
    now: DateTime<Utc>,
) -> Result<Option<ClampedTimeLog>, EngineError> {
    let start = DateTime::parse_from_rfc3339(input.start_time)
        .map_err(|e| EngineError::ParseTime(e.to_string()))?
        .with_timezone(&Utc);

    let end = match input.end_time {
        Some(end_str) => DateTime::parse_from_rfc3339(end_str)
            .map_err(|e| EngineError::ParseTime(e.to_string()))?
            .with_timezone(&Utc),
        None => now,
    };

    if end < start {
        return Ok(None);
    }

    let original_duration = end.signed_duration_since(start).num_seconds().max(0) as u64;

    let effective_start = match range_start {
        Some(rs) => std::cmp::max(start, rs),
        None => start,
    };

    let effective_end = match range_end {
        Some(re) => std::cmp::min(end, re),
        None => end,
    };

    if effective_end <= effective_start {
        return Ok(None);
    }

    let clamped_duration = effective_end
        .signed_duration_since(effective_start)
        .num_seconds()
        .max(0) as u64;

    let is_multi_day = effective_start != start || effective_end != end;

    Ok(Some(ClampedTimeLog {
        id: input.id.to_string(),
        project_id: input.project_id.to_string(),
        task_id: input.task_id.to_string(),
        start_time: input.start_time.to_string(),
        end_time: input.end_time.map(|s| s.to_string()),
        original_duration_seconds: original_duration,
        clamped_duration_seconds: clamped_duration,
        is_multi_day_segment: is_multi_day,
        clamped_start_time: effective_start.to_rfc3339(),
        clamped_end_time: effective_end.to_rfc3339(),
        note: input.note.map(|s| s.to_string()),
        is_patch: Some(input.is_patch),
    }))
}
