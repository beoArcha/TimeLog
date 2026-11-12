use super::constants::LOCAL_DATE_FORMAT;
use super::entries::{Bounds, MeasuredEntry};
use crate::engine::range::{local_start_of_day, shift_days};
use crate::engine::EngineError;
use crate::types::ReportDay;
use chrono::{DateTime, Duration, NaiveDate, Utc};
use chrono_tz::Tz;
use std::collections::BTreeMap;

type SecondsByDay = BTreeMap<NaiveDate, u64>;

pub(super) fn build_days(
    measured: &[MeasuredEntry<'_>],
    bounds: &Bounds,
) -> Result<Vec<ReportDay>, EngineError> {
    let mut seconds_by_day = SecondsByDay::new();
    for entry in measured {
        split_across_days(entry, bounds.tz, &mut seconds_by_day)?;
    }
    if let (Some(from), Some(to)) = (bounds.from, bounds.to) {
        seed_zero_days(from, to, bounds.tz, &mut seconds_by_day)?;
    }
    Ok(seconds_by_day
        .into_iter()
        .map(|(day, seconds)| ReportDay {
            date: day.format(LOCAL_DATE_FORMAT).to_string(),
            seconds,
        })
        .collect())
}

/// Each day gets the whole seconds elapsed up to its closing midnight minus what earlier days
/// already took, so the segments always add up to the entry's `seconds` even when a stored
/// instant carries a sub-second fraction.
fn split_across_days(
    entry: &MeasuredEntry<'_>,
    tz: Tz,
    seconds_by_day: &mut SecondsByDay,
) -> Result<(), EngineError> {
    let mut assigned = 0;
    let mut day = entry.in_range_start.with_timezone(&tz).date_naive();
    loop {
        let next_day = shift_days(day, 1)?;
        let segment_end = local_start_of_day(tz, next_day)?.min(entry.in_range_end);
        let elapsed = whole_seconds(entry.in_range_start, segment_end).max(assigned);
        *seconds_by_day.entry(day).or_default() += elapsed - assigned;
        assigned = elapsed;
        if segment_end >= entry.in_range_end {
            return Ok(());
        }
        day = next_day;
    }
}

/// `to` is exclusive: a range ending exactly at local midnight does not include that day.
fn seed_zero_days(
    from: DateTime<Utc>,
    to: DateTime<Utc>,
    tz: Tz,
    seconds_by_day: &mut SecondsByDay,
) -> Result<(), EngineError> {
    let last_day = (to - Duration::nanoseconds(1))
        .with_timezone(&tz)
        .date_naive();
    let mut day = from.with_timezone(&tz).date_naive();
    while day <= last_day {
        seconds_by_day.entry(day).or_default();
        day = shift_days(day, 1)?;
    }
    Ok(())
}

fn whole_seconds(from: DateTime<Utc>, to: DateTime<Utc>) -> u64 {
    to.signed_duration_since(from).num_seconds().max(0) as u64
}
