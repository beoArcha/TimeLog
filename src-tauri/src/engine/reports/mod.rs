mod billing;
mod catalog;
pub(crate) mod constants;
mod days;
mod entries;
mod ordering;
mod tree;

use super::range::{format_utc, resolve_range_at, resolve_timezone};
use super::{Engine, EngineError};
use crate::engine::billing::default_rate_cents_from_configs;
use crate::types::{
    PatchLog, Project, ReportDocument, ReportFilters, ReportGenerator, ReportRequest, ReportTotals,
    ReportVariant, ResolvedRange, Task, TimeLog, REPORT_SCHEMA_NAME, REPORT_SCHEMA_VERSION,
};
use billing::RateResolver;
use catalog::Catalog;
use chrono::{DateTime, Utc};
use constants::{GENERATOR_NAME, GENERATOR_VERSION};
use days::build_days;
use entries::{build_entries, measure_entries, Bounds, Scope};
use tree::{build_projects, Aggregate, ProjectsReport};

/// Everything a report reads, captured once so every figure comes from the same data.
#[derive(Debug, Clone, Default)]
pub struct ReportSnapshot {
    pub projects: Vec<Project>,
    pub tasks: Vec<Task>,
    pub logs: Vec<TimeLog>,
    pub patches: Vec<PatchLog>,
    /// Fallback hourly rate for tasks and projects that configure none; read once so every
    /// figure uses the rates configured at the same instant.
    pub default_rate_cents: Option<u64>,
}

impl Engine<'_> {
    pub fn build_report(&self, request: &ReportRequest) -> Result<ReportDocument, EngineError> {
        // One instant drives both range presets and running-entry measurement.
        let now = Utc::now();
        let settings = self.persistence.settings.get()?;
        let tz = resolve_timezone(
            request.range.timezone.as_deref(),
            settings.timezone.as_deref(),
        )?;
        let range = resolve_range_at(&request.range, now, tz)?;
        let snapshot = self.load_report_snapshot(includes_patches(request))?;
        build_report_at(&snapshot, request, &range, now)
    }

    fn load_report_snapshot(&self, include_patches: bool) -> Result<ReportSnapshot, EngineError> {
        let patches = if include_patches {
            self.persistence.patches.get_all()?
        } else {
            Vec::new()
        };
        let configs = self.persistence.settings.get_runtime_configs()?;
        Ok(ReportSnapshot {
            projects: self.persistence.projects.get_all()?,
            tasks: self.persistence.tasks.get_all()?,
            logs: self.persistence.time_logs.get_all()?,
            patches,
            default_rate_cents: default_rate_cents_from_configs(&configs),
        })
    }
}

/// Pure core of `Engine::build_report`: the clock is injected so the same inputs always yield
/// the same document.
///
/// Task and subtask amounts are authoritative: each is rounded once from its own
/// `direct_seconds`, and the billing totals sum exactly those. Entry amounts are rounded
/// individually, so they may not add up to the task amount they belong to.
pub fn build_report_at(
    snapshot: &ReportSnapshot,
    request: &ReportRequest,
    range: &ResolvedRange,
    generated_at: DateTime<Utc>,
) -> Result<ReportDocument, EngineError> {
    let include_patches = includes_patches(request);
    let bounds = Bounds::from_range(range, generated_at)?;
    let catalog = Catalog::new(&snapshot.projects, &snapshot.tasks);
    let scope = Scope {
        project_id: request.project_id.as_deref(),
        task_id: request.task_id.as_deref(),
        include_patches,
    };

    let measured = measure_entries(snapshot, &catalog, &scope, &bounds)?;
    let total_seconds = measured.iter().map(|entry| entry.seconds).sum();
    let aggregate = Aggregate::from_entries(&measured);
    let rates = RateResolver::new(&catalog, snapshot.default_rate_cents);
    let ProjectsReport { projects, tally } =
        build_projects(&catalog, &aggregate, &rates, total_seconds)?;
    let entries = match request.variant {
        ReportVariant::Full => Some(build_entries(&measured, &catalog, &rates)?),
        ReportVariant::Summary => None,
    };
    let days = build_days(&measured, &bounds)?;
    let split = tally.split();

    Ok(ReportDocument {
        schema: REPORT_SCHEMA_NAME.to_string(),
        schema_version: REPORT_SCHEMA_VERSION,
        variant: request.variant,
        generated_at: format_utc(generated_at),
        generator: ReportGenerator {
            name: GENERATOR_NAME.to_string(),
            version: GENERATOR_VERSION.to_string(),
        },
        range: range.clone(),
        filters: ReportFilters {
            project_id: request.project_id.clone(),
            task_id: request.task_id.clone(),
            include_patches,
        },
        totals: ReportTotals {
            seconds: total_seconds,
            entry_count: measured.len() as u64,
            billable_seconds: split.billable,
            non_billable_seconds: split.non_billable,
            unconfigured_seconds: split.unconfigured,
            billing: tally.currency_totals(),
        },
        projects,
        days,
        entries,
    })
}

fn includes_patches(request: &ReportRequest) -> bool {
    request.include_patches.unwrap_or(false)
}
