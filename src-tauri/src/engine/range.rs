use super::{Engine, EngineError};
use crate::types::{RangePreset, RangeRequest, ResolvedRange};
use chrono::{
    DateTime, Datelike, Days, Duration, LocalResult, Months, NaiveDate, NaiveDateTime, NaiveTime,
    SecondsFormat, TimeZone, Timelike, Utc,
};
use chrono_tz::Tz;

const SYSTEM_TIMEZONE: &str = "System";
const DATETIME_FORMATS: [&str; 2] = ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"];
const DATE_FORMAT: &str = "%Y-%m-%d";
// chrono parses numeric fields leniently (unpadded, signed years); `N` marks a required ASCII digit.
const DATETIME_SHAPES: [&str; 2] = ["NNNN-NN-NNTNN:NN:NN", "NNNN-NN-NN NN:NN:NN"];
const DATE_SHAPE: &str = "NNNN-NN-NN";
// chrono encodes a leap second as nanosecond >= 1e9 on second 59.
const NANOS_PER_SECOND: u32 = 1_000_000_000;
// Real-world DST gaps are at most a couple of hours; a full day bounds the search without a panic path.
const MAX_GAP_MINUTES: i64 = 24 * 60;

const MSG_PRESET_WITH_BOUNDS: &str = "preset cannot be combined with from/to";
const MSG_UNPARSEABLE_BOUND: &str = "unrecognized date/time value";
const MSG_EMPTY_BOUNDS: &str = "from must be earlier than to";
const MSG_DATE_OUT_OF_RANGE: &str = "date is out of the supported range";
const MSG_UNRESOLVABLE_LOCAL: &str = "local time cannot be resolved in the timezone";

/// A custom bound is either a calendar day (whose meaning depends on being `from` or `to`) or an exact instant.
enum ParsedBound {
    Day(NaiveDate),
    Instant(DateTime<Utc>),
}

pub fn resolve_timezone(explicit: Option<&str>, setting: Option<&str>) -> Result<Tz, EngineError> {
    let chosen = [explicit, setting]
        .into_iter()
        .flatten()
        .map(str::trim)
        .find(|value| !value.is_empty());

    match chosen {
        None => Ok(system_timezone()),
        Some(name) if name.eq_ignore_ascii_case(SYSTEM_TIMEZONE) => Ok(system_timezone()),
        Some(name) => name
            .parse::<Tz>()
            .map_err(|_| EngineError::InvalidTimezone(name.to_string())),
    }
}

// UTC is the documented, visible default when the OS zone is undetectable or unknown to chrono-tz.
fn system_timezone() -> Tz {
    iana_time_zone::get_timezone()
        .ok()
        .and_then(|name| name.parse::<Tz>().ok())
        .unwrap_or(Tz::UTC)
}

pub fn resolve_range_at(
    request: &RangeRequest,
    now: DateTime<Utc>,
    tz: Tz,
) -> Result<ResolvedRange, EngineError> {
    let (from, to) = match request.preset {
        Some(preset) => resolve_preset(request, preset, now, tz)?,
        None => resolve_custom(request, tz)?,
    };

    if let (Some(from), Some(to)) = (from, to) {
        ensure_ascending(from, to)?;
    }

    Ok(ResolvedRange {
        from: from.map(format_utc),
        to: to.map(format_utc),
        timezone: tz.name().to_string(),
        preset: request.preset,
    })
}

impl Engine<'_> {
    pub fn resolve_range(&self, request: &RangeRequest) -> Result<ResolvedRange, EngineError> {
        let settings = self.persistence.settings.get()?;
        let tz = resolve_timezone(request.timezone.as_deref(), settings.timezone.as_deref())?;
        resolve_range_at(request, Utc::now(), tz)
    }
}

type Bounds = (Option<DateTime<Utc>>, Option<DateTime<Utc>>);

fn resolve_preset(
    request: &RangeRequest,
    preset: RangePreset,
    now: DateTime<Utc>,
    tz: Tz,
) -> Result<Bounds, EngineError> {
    if request.from.is_some() || request.to.is_some() {
        return Err(EngineError::InvalidRangeInput(
            MSG_PRESET_WITH_BOUNDS.to_string(),
        ));
    }

    let today = now.with_timezone(&tz).date_naive();
    match preset_days(preset, today)? {
        Some((from_day, to_day)) => Ok((
            Some(local_start_of_day(tz, from_day)?),
            Some(local_start_of_day(tz, to_day)?),
        )),
        None => Ok((None, None)),
    }
}

fn preset_days(
    preset: RangePreset,
    today: NaiveDate,
) -> Result<Option<(NaiveDate, NaiveDate)>, EngineError> {
    let week_start = shift_days(today, -i64::from(today.weekday().num_days_from_monday()))?;
    let month_start = today.with_day(1).ok_or_else(out_of_range)?;

    let days = match preset {
        RangePreset::All => return Ok(None),
        RangePreset::Today => (today, shift_days(today, 1)?),
        RangePreset::Yesterday => (shift_days(today, -1)?, today),
        RangePreset::Week => (week_start, shift_days(week_start, 7)?),
        RangePreset::LastWeek => (shift_days(week_start, -7)?, week_start),
        RangePreset::Month => (month_start, shift_months(month_start, 1)?),
        RangePreset::LastMonth => (shift_months(month_start, -1)?, month_start),
    };
    Ok(Some(days))
}

fn shift_days(day: NaiveDate, days: i64) -> Result<NaiveDate, EngineError> {
    let magnitude = Days::new(days.unsigned_abs());
    let shifted = if days >= 0 {
        day.checked_add_days(magnitude)
    } else {
        day.checked_sub_days(magnitude)
    };
    shifted.ok_or_else(out_of_range)
}

fn shift_months(day: NaiveDate, months: i32) -> Result<NaiveDate, EngineError> {
    let magnitude = Months::new(months.unsigned_abs());
    let shifted = if months >= 0 {
        day.checked_add_months(magnitude)
    } else {
        day.checked_sub_months(magnitude)
    };
    shifted.ok_or_else(out_of_range)
}

fn resolve_custom(request: &RangeRequest, tz: Tz) -> Result<Bounds, EngineError> {
    let from = match request.from.as_deref() {
        Some(raw) => Some(bound_to_instant(parse_bound(raw, tz)?, tz, false)?),
        None => None,
    };
    let to = match request.to.as_deref() {
        Some(raw) => Some(bound_to_instant(parse_bound(raw, tz)?, tz, true)?),
        None => None,
    };
    Ok((from, to))
}

fn parse_bound(raw: &str, tz: Tz) -> Result<ParsedBound, EngineError> {
    let value = raw.trim();
    let unparseable =
        || EngineError::InvalidRangeInput(format!("{MSG_UNPARSEABLE_BOUND}: '{value}'"));

    if let Ok(with_offset) = DateTime::parse_from_rfc3339(value) {
        return whole_second_instant(with_offset.with_timezone(&Utc))
            .map(ParsedBound::Instant)
            .ok_or_else(unparseable);
    }
    if DATETIME_SHAPES
        .iter()
        .any(|shape| matches_shape(value, shape))
    {
        let local = parse_naive_datetime(value).ok_or_else(unparseable)?;
        return Ok(ParsedBound::Instant(resolve_local(tz, local)?));
    }
    if matches_shape(value, DATE_SHAPE) {
        return NaiveDate::parse_from_str(value, DATE_FORMAT)
            .map(ParsedBound::Day)
            .map_err(|_| unparseable());
    }
    Err(unparseable())
}

fn matches_shape(value: &str, shape: &str) -> bool {
    value.len() == shape.len()
        && value.bytes().zip(shape.bytes()).all(|(actual, expected)| {
            if expected == b'N' {
                actual.is_ascii_digit()
            } else {
                actual == expected
            }
        })
}

fn parse_naive_datetime(value: &str) -> Option<NaiveDateTime> {
    DATETIME_FORMATS
        .iter()
        .find_map(|format| NaiveDateTime::parse_from_str(value, format).ok())
        .filter(|local| local.nanosecond() < NANOS_PER_SECOND)
}

/// Bounds are compared and emitted at whole-second precision, so sub-second parts are dropped before `from >= to`.
fn whole_second_instant(instant: DateTime<Utc>) -> Option<DateTime<Utc>> {
    Some(instant)
        .filter(|value| value.nanosecond() < NANOS_PER_SECOND)
        .and_then(|value| value.with_nanosecond(0))
}

/// A date-only `to` covers the whole named day, so it resolves to the following local midnight.
fn bound_to_instant(
    bound: ParsedBound,
    tz: Tz,
    is_upper: bool,
) -> Result<DateTime<Utc>, EngineError> {
    match bound {
        ParsedBound::Instant(instant) => Ok(instant),
        ParsedBound::Day(day) if is_upper => local_start_of_day(tz, shift_days(day, 1)?),
        ParsedBound::Day(day) => local_start_of_day(tz, day),
    }
}

fn ensure_ascending(from: DateTime<Utc>, to: DateTime<Utc>) -> Result<(), EngineError> {
    if from >= to {
        return Err(EngineError::InvalidRangeInput(MSG_EMPTY_BOUNDS.to_string()));
    }
    Ok(())
}

fn local_start_of_day(tz: Tz, day: NaiveDate) -> Result<DateTime<Utc>, EngineError> {
    resolve_local(tz, day.and_time(NaiveTime::MIN))
}

/// Overlaps resolve to the earlier instant; gaps resolve to the first local minute that exists.
fn resolve_local(tz: Tz, local: NaiveDateTime) -> Result<DateTime<Utc>, EngineError> {
    match tz.from_local_datetime(&local) {
        LocalResult::Single(instant) => Ok(instant.with_timezone(&Utc)),
        LocalResult::Ambiguous(earliest, _) => Ok(earliest.with_timezone(&Utc)),
        LocalResult::None => first_valid_after_gap(tz, local),
    }
}

fn first_valid_after_gap(tz: Tz, local: NaiveDateTime) -> Result<DateTime<Utc>, EngineError> {
    (1..=MAX_GAP_MINUTES)
        .map(|minutes| local + Duration::minutes(minutes))
        .find_map(|candidate| tz.from_local_datetime(&candidate).earliest())
        .map(|instant| instant.with_timezone(&Utc))
        .ok_or_else(|| EngineError::InvalidRangeInput(MSG_UNRESOLVABLE_LOCAL.to_string()))
}

pub(crate) fn format_utc(instant: DateTime<Utc>) -> String {
    instant.to_rfc3339_opts(SecondsFormat::Secs, true)
}

fn out_of_range() -> EngineError {
    EngineError::InvalidRangeInput(MSG_DATE_OUT_OF_RANGE.to_string())
}
