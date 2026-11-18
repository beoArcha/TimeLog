use super::attribution::TaskProjectIndex;
use super::clamping::{clamp_interval, IntervalInput};
use crate::engine::{Engine, EngineError};
use crate::types::{ElapsedRangeFilter, RangeMetricsResult};
use chrono::{DateTime, Utc};
use std::collections::{HashMap, HashSet};
use std::time::Duration;

impl<'a> Engine<'a> {
    pub fn calculate_elapsed_range(
        &self,
        filter: &ElapsedRangeFilter,
    ) -> Result<Duration, EngineError> {
        let metrics = self.calculate_range_metrics(filter, None)?;
        Ok(Duration::from_secs(metrics.total_seconds))
    }

    pub fn calculate_range_metrics(
        &self,
        filter: &ElapsedRangeFilter,
        now_iso: Option<&str>,
    ) -> Result<RangeMetricsResult, EngineError> {
        let now = match now_iso {
            Some(s) => DateTime::parse_from_rfc3339(s)
                .map_err(|e| EngineError::ParseTime(e.to_string()))?
                .with_timezone(&Utc),
            None => Utc::now(),
        };

        let range_start = parse_optional_utc(filter.from.as_deref())?;
        let range_end = parse_optional_utc(filter.to.as_deref())?;

        let relevant_task_ids: Option<HashSet<String>> = match filter.task_id.as_deref() {
            Some(tid) => Some(self.collect_relevant_task_ids(tid)?),
            None => None,
        };

        let mut result = RangeMetricsResult {
            total_seconds: 0,
            project_elapsed: HashMap::new(),
            task_elapsed: HashMap::new(),
            clamped_logs: Vec::new(),
        };

        let all_tasks = self.persistence.tasks.get_all()?;
        let attribution = TaskProjectIndex::new(&all_tasks);

        let all_logs = self.persistence.time_logs.get_all()?;
        for log in &all_logs {
            if let Some(ref task_ids) = relevant_task_ids {
                if !task_ids.contains(&log.task_id) {
                    continue;
                }
            }
            let project_id = attribution.resolve(Some(&log.task_id), &log.project_id);
            if !matches_project_filter(filter, project_id) {
                continue;
            }

            let input = IntervalInput {
                id: &log.id,
                project_id,
                task_id: &log.task_id,
                start_time: &log.start_time,
                end_time: log.end_time.as_deref(),
                note: log.note.as_deref(),
                is_patch: false,
            };

            let Some(clamped) = clamp_interval(input, range_start, range_end, now)? else {
                continue;
            };

            result.total_seconds += clamped.clamped_duration_seconds;
            *result
                .project_elapsed
                .entry(clamped.project_id.clone())
                .or_insert(0) += clamped.clamped_duration_seconds;
            *result
                .task_elapsed
                .entry(clamped.task_id.clone())
                .or_insert(0) += clamped.clamped_duration_seconds;
            result.clamped_logs.push(clamped);
        }

        if filter.include_patches.unwrap_or(false) {
            let bounds = RangeIntervalBounds {
                start: range_start,
                end: range_end,
                now,
            };
            let scope = PatchScope {
                filter,
                relevant_task_ids: relevant_task_ids.as_ref(),
                attribution: &attribution,
            };
            self.process_patches(&scope, bounds, &mut result)?;
        }

        Ok(result)
    }

    fn collect_relevant_task_ids(
        &self,
        root_task_id: &str,
    ) -> Result<HashSet<String>, EngineError> {
        let mut ids = HashSet::new();
        ids.insert(root_task_id.to_string());
        let mut queue = vec![root_task_id.to_string()];
        while let Some(parent_id) = queue.pop() {
            let subtasks = self.persistence.tasks.get_subtasks(&parent_id)?;
            for sub in subtasks {
                if ids.insert(sub.id.clone()) {
                    queue.push(sub.id);
                }
            }
        }
        Ok(ids)
    }

    fn process_patches(
        &self,
        scope: &PatchScope<'_>,
        bounds: RangeIntervalBounds,
        acc: &mut RangeMetricsResult,
    ) -> Result<(), EngineError> {
        let patches = self.persistence.patches.get_all()?;
        for patch in &patches {
            let project_id = scope
                .attribution
                .resolve(patch.task_id.as_deref(), &patch.project_id);
            if !matches_project_filter(scope.filter, project_id) {
                continue;
            }
            if let Some(task_ids) = scope.relevant_task_ids {
                let matches_task = patch
                    .task_id
                    .as_deref()
                    .map(|tid| task_ids.contains(tid))
                    .unwrap_or(false);
                if !matches_task {
                    continue;
                }
            }

            let task_id_str = patch.task_id.as_deref().unwrap_or_default();
            let input = IntervalInput {
                id: &patch.id,
                project_id,
                task_id: task_id_str,
                start_time: &patch.start_time,
                end_time: Some(&patch.end_time),
                note: Some(&patch.patch_note),
                is_patch: true,
            };

            let Some(clamped) = clamp_interval(input, bounds.start, bounds.end, bounds.now)? else {
                continue;
            };

            acc.total_seconds += clamped.clamped_duration_seconds;
            *acc.project_elapsed
                .entry(clamped.project_id.clone())
                .or_insert(0) += clamped.clamped_duration_seconds;
            if !clamped.task_id.is_empty() {
                *acc.task_elapsed.entry(clamped.task_id.clone()).or_insert(0) +=
                    clamped.clamped_duration_seconds;
            }
            acc.clamped_logs.push(clamped);
        }
        Ok(())
    }
}

struct PatchScope<'a> {
    filter: &'a ElapsedRangeFilter,
    relevant_task_ids: Option<&'a HashSet<String>>,
    attribution: &'a TaskProjectIndex<'a>,
}

fn matches_project_filter(filter: &ElapsedRangeFilter, project_id: &str) -> bool {
    let matches_single = filter
        .project_id
        .as_deref()
        .is_none_or(|wanted| wanted == project_id);
    let matches_many = filter
        .project_ids
        .as_ref()
        .is_none_or(|wanted| wanted.iter().any(|id| id == project_id));
    matches_single && matches_many
}

struct RangeIntervalBounds {
    start: Option<DateTime<Utc>>,
    end: Option<DateTime<Utc>>,
    now: DateTime<Utc>,
}

fn parse_optional_utc(opt: Option<&str>) -> Result<Option<DateTime<Utc>>, EngineError> {
    match opt {
        Some(s) => {
            let dt = DateTime::parse_from_rfc3339(s)
                .map_err(|e| EngineError::ParseTime(e.to_string()))?
                .with_timezone(&Utc);
            Ok(Some(dt))
        }
        None => Ok(None),
    }
}
