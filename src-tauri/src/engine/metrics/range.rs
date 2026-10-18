use super::clamping::{clamp_interval, IntervalInput};
use crate::engine::{Engine, EngineError};
use crate::types::{ClampedTimeLog, ElapsedRangeFilter, RangeMetricsResult};
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

        let range_start = if let Some(ref s) = filter.from {
            Some(
                DateTime::parse_from_rfc3339(s)
                    .map_err(|e| EngineError::ParseTime(e.to_string()))?
                    .with_timezone(&Utc),
            )
        } else {
            None
        };

        let range_end = if let Some(ref e) = filter.to {
            Some(
                DateTime::parse_from_rfc3339(e)
                    .map_err(|e| EngineError::ParseTime(e.to_string()))?
                    .with_timezone(&Utc),
            )
        } else {
            None
        };

        let relevant_task_ids: Option<HashSet<String>> = if let Some(ref tid) = filter.task_id {
            let mut ids = HashSet::new();
            ids.insert(tid.clone());
            let mut queue = vec![tid.clone()];
            while let Some(parent_id) = queue.pop() {
                if let Ok(subtasks) = self.persistence.tasks.get_subtasks(&parent_id) {
                    for sub in subtasks {
                        if ids.insert(sub.id.clone()) {
                            queue.push(sub.id);
                        }
                    }
                }
            }
            Some(ids)
        } else {
            None
        };

        let mut total_seconds: u64 = 0;
        let mut project_elapsed: HashMap<String, u64> = HashMap::new();
        let mut task_elapsed: HashMap<String, u64> = HashMap::new();
        let mut clamped_logs: Vec<ClampedTimeLog> = Vec::new();

        let all_logs = self.persistence.time_logs.get_all()?;
        for log in &all_logs {
            if let Some(ref task_ids) = relevant_task_ids {
                if !task_ids.contains(&log.task_id) {
                    continue;
                }
            }
            if let Some(ref target_project_id) = filter.project_id {
                if &log.project_id != target_project_id {
                    continue;
                }
            }

            let input = IntervalInput {
                id: &log.id,
                project_id: &log.project_id,
                task_id: &log.task_id,
                start_time: &log.start_time,
                end_time: log.end_time.as_deref(),
                note: log.note.as_deref(),
                is_patch: false,
            };

            if let Some(clamped) = clamp_interval(input, range_start, range_end, now)? {
                total_seconds += clamped.clamped_duration_seconds;
                *project_elapsed
                    .entry(clamped.project_id.clone())
                    .or_insert(0) += clamped.clamped_duration_seconds;
                *task_elapsed.entry(clamped.task_id.clone()).or_insert(0) +=
                    clamped.clamped_duration_seconds;
                clamped_logs.push(clamped);
            }
        }

        if filter.include_patches.unwrap_or(false) {
            let patches = self.persistence.patches.get_all()?;
            for patch in &patches {
                if let Some(ref target_project_id) = filter.project_id {
                    if &patch.project_id != target_project_id {
                        continue;
                    }
                }
                if let Some(ref task_ids) = relevant_task_ids {
                    if let Some(ref tid) = patch.task_id {
                        if !task_ids.contains(tid) {
                            continue;
                        }
                    } else {
                        continue;
                    }
                }

                let task_id_str = patch.task_id.as_deref().unwrap_or_default();
                let input = IntervalInput {
                    id: &patch.id,
                    project_id: &patch.project_id,
                    task_id: task_id_str,
                    start_time: &patch.start_time,
                    end_time: Some(&patch.end_time),
                    note: Some(&patch.patch_note),
                    is_patch: true,
                };

                if let Some(clamped) = clamp_interval(input, range_start, range_end, now)? {
                    total_seconds += clamped.clamped_duration_seconds;
                    *project_elapsed
                        .entry(clamped.project_id.clone())
                        .or_insert(0) += clamped.clamped_duration_seconds;
                    if !clamped.task_id.is_empty() {
                        *task_elapsed.entry(clamped.task_id.clone()).or_insert(0) +=
                            clamped.clamped_duration_seconds;
                    }
                    clamped_logs.push(clamped);
                }
            }
        }

        Ok(RangeMetricsResult {
            total_seconds,
            project_elapsed,
            task_elapsed,
            clamped_logs,
        })
    }
}
