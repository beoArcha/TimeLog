use super::catalog::Catalog;
use super::constants::LOCAL_DATE_FORMAT;
use super::ordering::sort_entries;
use super::ReportSnapshot;
use crate::engine::metrics::clamping::{clamp_interval, IntervalInput};
use crate::engine::range::format_utc;
use crate::engine::EngineError;
use crate::types::{ReportEntry, ResolvedRange, Task};
use chrono::{DateTime, Utc};
use chrono_tz::Tz;

pub(super) struct Bounds {
    from: Option<DateTime<Utc>>,
    to: Option<DateTime<Utc>>,
    tz: Tz,
    now: DateTime<Utc>,
}

impl Bounds {
    pub(super) fn from_range(
        range: &ResolvedRange,
        now: DateTime<Utc>,
    ) -> Result<Self, EngineError> {
        let tz = range
            .timezone
            .parse::<Tz>()
            .map_err(|_| EngineError::InvalidTimezone(range.timezone.clone()))?;
        Ok(Self {
            from: range.from.as_deref().map(parse_instant).transpose()?,
            to: range.to.as_deref().map(parse_instant).transpose()?,
            tz,
            now,
        })
    }
}

pub(super) struct Scope<'a> {
    pub project_id: Option<&'a str>,
    pub task_id: Option<&'a str>,
    pub include_patches: bool,
}

/// A log or patch with time inside the range, already clamped and placed in its task hierarchy.
pub(super) struct MeasuredEntry<'a> {
    pub id: &'a str,
    pub project_id: &'a str,
    /// The entry's own task first, its root task last; empty for a task-less patch.
    pub chain: Vec<&'a Task>,
    pub start: String,
    pub end: Option<String>,
    pub date: String,
    pub note: Option<&'a str>,
    pub is_patch: bool,
    pub seconds: u64,
    pub original_seconds: u64,
    pub clamped: bool,
}

struct RawInterval<'a> {
    id: &'a str,
    project_id: &'a str,
    task_id: Option<&'a str>,
    start: &'a str,
    end: Option<&'a str>,
    note: Option<&'a str>,
    is_patch: bool,
}

pub(super) fn measure_entries<'a>(
    snapshot: &'a ReportSnapshot,
    catalog: &Catalog<'a>,
    scope: &Scope<'_>,
    bounds: &Bounds,
) -> Result<Vec<MeasuredEntry<'a>>, EngineError> {
    let mut measured = Vec::new();
    for raw in raw_intervals(snapshot, scope.include_patches) {
        if let Some(entry) = measure(&raw, catalog, scope, bounds)? {
            measured.push(entry);
        }
    }
    Ok(measured)
}

pub(super) fn build_entries(
    measured: &[MeasuredEntry<'_>],
    catalog: &Catalog<'_>,
) -> Result<Vec<ReportEntry>, EngineError> {
    let mut entries = measured
        .iter()
        .map(|entry| to_report_entry(entry, catalog))
        .collect::<Result<Vec<_>, _>>()?;
    sort_entries(&mut entries);
    Ok(entries)
}

fn raw_intervals(
    snapshot: &ReportSnapshot,
    include_patches: bool,
) -> impl Iterator<Item = RawInterval<'_>> {
    let logs = snapshot.logs.iter().map(|log| RawInterval {
        id: &log.id,
        project_id: &log.project_id,
        task_id: Some(log.task_id.as_str()),
        start: &log.start_time,
        end: log.end_time.as_deref(),
        note: log.note.as_deref(),
        is_patch: false,
    });
    let patches = snapshot
        .patches
        .iter()
        .filter(move |_| include_patches)
        .map(|patch| RawInterval {
            id: &patch.id,
            project_id: &patch.project_id,
            task_id: patch.task_id.as_deref(),
            start: &patch.start_time,
            end: Some(patch.end_time.as_str()),
            note: Some(patch.patch_note.as_str()),
            is_patch: true,
        });
    logs.chain(patches)
}

fn measure<'a>(
    raw: &RawInterval<'a>,
    catalog: &Catalog<'a>,
    scope: &Scope<'_>,
    bounds: &Bounds,
) -> Result<Option<MeasuredEntry<'a>>, EngineError> {
    let chain = match raw.task_id {
        Some(task_id) => catalog.chain(task_id)?,
        None => Vec::new(),
    };
    // The task's own project wins so the entry always lands under the project that owns its task.
    let project_id = chain
        .first()
        .map_or(raw.project_id, |task| task.project_id.as_str());

    let in_project = scope.project_id.is_none_or(|wanted| wanted == project_id);
    let in_task = scope
        .task_id
        .is_none_or(|wanted| chain.iter().any(|task| task.id == wanted));
    if !in_project || !in_task {
        return Ok(None);
    }

    let input = IntervalInput {
        id: raw.id,
        project_id,
        task_id: raw.task_id.unwrap_or_default(),
        start_time: raw.start,
        end_time: raw.end,
        note: raw.note,
        is_patch: raw.is_patch,
    };
    let Some(clamped) = clamp_interval(input, bounds.from, bounds.to, bounds.now)? else {
        return Ok(None);
    };

    Ok(Some(MeasuredEntry {
        id: raw.id,
        project_id,
        chain,
        start: normalize_instant(raw.start)?,
        end: raw.end.map(normalize_instant).transpose()?,
        date: local_date(&clamped.clamped_start_time, bounds.tz)?,
        note: raw.note,
        is_patch: raw.is_patch,
        seconds: clamped.clamped_duration_seconds,
        original_seconds: clamped.original_duration_seconds,
        clamped: clamped.is_multi_day_segment,
    }))
}

fn to_report_entry(
    entry: &MeasuredEntry<'_>,
    catalog: &Catalog<'_>,
) -> Result<ReportEntry, EngineError> {
    let project = catalog.project(entry.project_id)?;
    let task = entry.chain.first();
    let parent = entry.chain.get(1);

    // TODO(PR-13): resolve rate_minor, currency and amount_minor from the billing snapshot.
    Ok(ReportEntry {
        id: entry.id.to_string(),
        project_id: entry.project_id.to_string(),
        project_name: project.name.clone(),
        task_id: task.map(|t| t.id.clone()),
        task_name: task.map(|t| t.name.clone()),
        root_task_id: entry.chain.last().map(|t| t.id.clone()),
        parent_task_id: parent.map(|t| t.id.clone()),
        parent_task_name: parent.map(|t| t.name.clone()),
        start: entry.start.clone(),
        end: entry.end.clone(),
        date: entry.date.clone(),
        seconds: entry.seconds,
        original_seconds: entry.original_seconds,
        clamped: entry.clamped,
        is_patch: entry.is_patch,
        note: entry.note.map(str::to_string),
        rate_minor: None,
        currency: None,
        amount_minor: None,
    })
}

fn parse_instant(raw: &str) -> Result<DateTime<Utc>, EngineError> {
    DateTime::parse_from_rfc3339(raw)
        .map(|instant| instant.with_timezone(&Utc))
        .map_err(|e| EngineError::ParseTime(e.to_string()))
}

fn normalize_instant(raw: &str) -> Result<String, EngineError> {
    parse_instant(raw).map(format_utc)
}

fn local_date(instant: &str, tz: Tz) -> Result<String, EngineError> {
    parse_instant(instant).map(|utc| utc.with_timezone(&tz).format(LOCAL_DATE_FORMAT).to_string())
}
