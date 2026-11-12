use crate::engine::EngineError;
use crate::types::ResolvedRange;
use chrono::{DateTime, NaiveDateTime, Utc};

const NAIVE_LOG_TIMESTAMP_FORMAT: &str = "%Y-%m-%dT%H:%M:%S";
const MSG_UNPARSEABLE_RESOLVED_BOUND: &str = "resolved range bound is not RFC3339";

/// Stored logs may predate offset-aware timestamps, so naive values are read as UTC.
pub fn parse_log_timestamp(raw: &str) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(raw)
        .map(|dt| dt.with_timezone(&Utc))
        .ok()
        .or_else(|| {
            NaiveDateTime::parse_from_str(raw, NAIVE_LOG_TIMESTAMP_FORMAT)
                .ok()
                .map(|ndt| DateTime::<Utc>::from_naive_utc_and_offset(ndt, Utc))
        })
}

/// Half-open `[from, to)` window over log start times, built from an engine-resolved range.
#[derive(Debug, Clone, Copy, Default)]
pub struct RangeBounds {
    from: Option<DateTime<Utc>>,
    to: Option<DateTime<Utc>>,
}

impl RangeBounds {
    pub fn from_resolved(range: &ResolvedRange) -> Result<Self, EngineError> {
        Ok(Self {
            from: parse_bound(range.from.as_deref())?,
            to: parse_bound(range.to.as_deref())?,
        })
    }

    /// An unbounded window keeps every log, including ones whose timestamp cannot be parsed.
    pub fn contains(&self, start_time: &str) -> bool {
        if self.from.is_none() && self.to.is_none() {
            return true;
        }
        let Some(start) = parse_log_timestamp(start_time) else {
            return false;
        };
        let after_from = self.from.is_none_or(|from| start >= from);
        let before_to = self.to.is_none_or(|to| start < to);
        after_from && before_to
    }
}

fn parse_bound(raw: Option<&str>) -> Result<Option<DateTime<Utc>>, EngineError> {
    raw.map(|value| {
        parse_log_timestamp(value).ok_or_else(|| {
            EngineError::InvalidRangeInput(format!("{MSG_UNPARSEABLE_RESOLVED_BOUND}: '{value}'"))
        })
    })
    .transpose()
}
