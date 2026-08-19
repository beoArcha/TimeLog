use super::{Engine, EngineError};
use crate::types::{
    ElapsedRangeFilter, EngineComputedMetrics, Project, ProjectComputedMetrics, ProjectStatistics,
    Task, TaskComputedMetrics, TimeLog,
};
use chrono::{DateTime, Datelike, Utc};
use std::collections::HashMap;
use std::time::Duration;

#[derive(Default)]
pub(crate) struct LogAggregates {
    pub task_self_elapsed: HashMap<String, u64>,
    pub task_is_running: HashMap<String, bool>,
    pub project_total_elapsed: HashMap<String, u64>,
    pub project_today_elapsed: HashMap<String, u64>,
    pub project_week_elapsed: HashMap<String, u64>,
    pub project_is_running: HashMap<String, bool>,
}

impl LogAggregates {
    pub fn compute(
        logs: &[TimeLog],
        now: DateTime<Utc>,
        start_of_today: DateTime<Utc>,
        start_of_week: DateTime<Utc>,
    ) -> Result<Self, EngineError> {
        let mut agg = Self::default();

        for log in logs {
            let start = DateTime::parse_from_rfc3339(&log.start_time)
                .map_err(|e| EngineError::ParseTime(e.to_string()))?
                .with_timezone(&Utc);

            let is_active = log.end_time.is_none();
            let end = match log.end_time {
                Some(ref end_str) => DateTime::parse_from_rfc3339(end_str)
                    .map_err(|e| EngineError::ParseTime(e.to_string()))?
                    .with_timezone(&Utc),
                None => now,
            };

            if end < start {
                continue;
            }

            let diff_secs = end.signed_duration_since(start).num_seconds().max(0) as u64;
            *agg.task_self_elapsed
                .entry(log.task_id.clone())
                .or_insert(0) += diff_secs;
            *agg.project_total_elapsed
                .entry(log.project_id.clone())
                .or_insert(0) += diff_secs;

            if is_active {
                agg.task_is_running.insert(log.task_id.clone(), true);
                agg.project_is_running.insert(log.project_id.clone(), true);
            }

            let today_secs = calculate_overlap_seconds(start, end, start_of_today, now);
            *agg.project_today_elapsed
                .entry(log.project_id.clone())
                .or_insert(0) += today_secs;

            let week_secs = calculate_overlap_seconds(start, end, start_of_week, now);
            *agg.project_week_elapsed
                .entry(log.project_id.clone())
                .or_insert(0) += week_secs;
        }

        Ok(agg)
    }
}

fn calculate_overlap_seconds(
    start: DateTime<Utc>,
    end: DateTime<Utc>,
    window_start: DateTime<Utc>,
    window_end: DateTime<Utc>,
) -> u64 {
    let overlap_start = start.max(window_start);
    let overlap_end = end.min(window_end);
    if overlap_end >= overlap_start {
        overlap_end
            .signed_duration_since(overlap_start)
            .num_seconds()
            .max(0) as u64
    } else {
        0
    }
}

struct TaskHierarchy {
    subtasks_map: HashMap<String, Vec<String>>,
    project_task_counts: HashMap<String, (usize, usize)>,
}

fn build_task_hierarchy(tasks: &[Task]) -> TaskHierarchy {
    let mut subtasks_map: HashMap<String, Vec<String>> = HashMap::new();
    let mut project_task_counts: HashMap<String, (usize, usize)> = HashMap::new();

    for task in tasks {
        let entry = project_task_counts
            .entry(task.project_id.clone())
            .or_insert((0, 0));
        if task.completed {
            entry.1 += 1;
        } else {
            entry.0 += 1;
        }

        if let Some(ref parent_id) = task.parent_task_id {
            subtasks_map
                .entry(parent_id.clone())
                .or_default()
                .push(task.id.clone());
        }
    }

    TaskHierarchy {
        subtasks_map,
        project_task_counts,
    }
}

fn compute_tasks_metrics(
    tasks: &[Task],
    subtasks_map: &HashMap<String, Vec<String>>,
    agg: &LogAggregates,
) -> HashMap<String, TaskComputedMetrics> {
    let mut computed_tasks = HashMap::with_capacity(tasks.len());

    for task in tasks {
        let self_elapsed = *agg.task_self_elapsed.get(&task.id).unwrap_or(&0);
        let is_running = *agg.task_is_running.get(&task.id).unwrap_or(&false);

        let mut subtask_elapsed = 0;
        let mut has_running_child = false;

        if let Some(sub_ids) = subtasks_map.get(&task.id) {
            for sub_id in sub_ids {
                subtask_elapsed += *agg.task_self_elapsed.get(sub_id).unwrap_or(&0);
                if *agg.task_is_running.get(sub_id).unwrap_or(&false) {
                    has_running_child = true;
                }
            }
        }

        computed_tasks.insert(
            task.id.clone(),
            TaskComputedMetrics {
                task_id: task.id.clone(),
                elapsed_seconds: self_elapsed + subtask_elapsed,
                self_elapsed_seconds: self_elapsed,
                is_running,
                has_running_child,
            },
        );
    }

    computed_tasks
}

fn compute_projects_metrics(
    projects: &[Project],
    project_task_counts: &HashMap<String, (usize, usize)>,
    agg: &LogAggregates,
) -> HashMap<String, ProjectComputedMetrics> {
    let mut computed_projects = HashMap::with_capacity(projects.len());

    for project in projects {
        let total_elapsed = *agg.project_total_elapsed.get(&project.id).unwrap_or(&0);
        let today_elapsed = *agg.project_today_elapsed.get(&project.id).unwrap_or(&0);
        let this_week_elapsed = *agg.project_week_elapsed.get(&project.id).unwrap_or(&0);
        let is_running = *agg.project_is_running.get(&project.id).unwrap_or(&false);
        let (active_count, completed_count) =
            *project_task_counts.get(&project.id).unwrap_or(&(0, 0));

        computed_projects.insert(
            project.id.clone(),
            ProjectComputedMetrics {
                project_id: project.id.clone(),
                total_elapsed_seconds: total_elapsed,
                today_elapsed_seconds: today_elapsed,
                this_week_elapsed_seconds: this_week_elapsed,
                active_task_count: active_count,
                completed_task_count: completed_count,
                is_running,
            },
        );
    }

    computed_projects
}

impl<'a> Engine<'a> {
    pub fn get_computed_metrics(
        &self,
        now_iso: Option<&str>,
    ) -> Result<EngineComputedMetrics, EngineError> {
        let projects = self.persistence.projects.get_all()?;
        let tasks = self.persistence.tasks.get_all()?;
        let logs = self.persistence.time_logs.get_all()?;

        let now = match now_iso {
            Some(s) => DateTime::parse_from_rfc3339(s)
                .map_err(|e| EngineError::ParseTime(e.to_string()))?
                .with_timezone(&Utc),
            None => Utc::now(),
        };
        let snapshot_now_iso = now.to_rfc3339();

        let start_of_today = now.date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc();
        let days_from_monday = now.weekday().num_days_from_monday() as i64;
        let start_of_week = start_of_today - chrono::Duration::days(days_from_monday);

        let agg = LogAggregates::compute(&logs, now, start_of_today, start_of_week)?;
        let hierarchy = build_task_hierarchy(&tasks);

        let computed_tasks = compute_tasks_metrics(&tasks, &hierarchy.subtasks_map, &agg);
        let computed_projects =
            compute_projects_metrics(&projects, &hierarchy.project_task_counts, &agg);

        Ok(EngineComputedMetrics {
            snapshot_now_iso,
            tasks: computed_tasks,
            projects: computed_projects,
        })
    }

    pub fn calculate_subtask_elapsed(&self, subtask_id: &str) -> Result<Duration, EngineError> {
        let logs = self.persistence.time_logs.get_for_task(subtask_id)?;
        let mut total_duration = Duration::ZERO;

        for log in logs {
            let start = DateTime::parse_from_rfc3339(&log.start_time)
                .map_err(|e| EngineError::ParseTime(e.to_string()))?
                .with_timezone(&Utc);

            let end = match log.end_time {
                Some(ref end_str) => DateTime::parse_from_rfc3339(end_str)
                    .map_err(|e| EngineError::ParseTime(e.to_string()))?
                    .with_timezone(&Utc),
                None => Utc::now(),
            };

            if end >= start {
                let diff = end.signed_duration_since(start);
                total_duration += Duration::from_secs(diff.num_seconds() as u64);
            }
        }

        Ok(total_duration)
    }

    pub fn calculate_task_elapsed(&self, task_id: &str) -> Result<Duration, EngineError> {
        let logs = self.persistence.time_logs.get_for_task(task_id)?;
        let mut total_duration = Duration::ZERO;

        for log in logs {
            let start = DateTime::parse_from_rfc3339(&log.start_time)
                .map_err(|e| EngineError::ParseTime(e.to_string()))?
                .with_timezone(&Utc);

            let end = match log.end_time {
                Some(ref end_str) => DateTime::parse_from_rfc3339(end_str)
                    .map_err(|e| EngineError::ParseTime(e.to_string()))?
                    .with_timezone(&Utc),
                None => Utc::now(),
            };

            if end >= start {
                let diff = end.signed_duration_since(start);
                total_duration += Duration::from_secs(diff.num_seconds() as u64);
            }
        }

        let subtasks = self.persistence.tasks.get_subtasks(task_id)?;
        for subtask in subtasks {
            total_duration += self.calculate_subtask_elapsed(&subtask.id)?;
        }

        Ok(total_duration)
    }

    pub fn calculate_project_elapsed(&self, project_id: &str) -> Result<Duration, EngineError> {
        let parent_tasks = self.persistence.projects.get_tasks(project_id)?;
        let mut total_duration = Duration::ZERO;

        for task in parent_tasks {
            total_duration += self.calculate_task_elapsed(&task.id)?;
        }

        Ok(total_duration)
    }

    pub fn calculate_elapsed_range(
        &self,
        filter: &ElapsedRangeFilter,
    ) -> Result<Duration, EngineError> {
        let all_logs = self.persistence.time_logs.get_all()?;
        let now = Utc::now();

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

        let mut total_duration = Duration::ZERO;

        for log in all_logs {
            if let Some(ref target_task_id) = filter.task_id {
                if &log.task_id != target_task_id {
                    continue;
                }
            }
            if let Some(ref target_project_id) = filter.project_id {
                if &log.project_id != target_project_id {
                    continue;
                }
            }

            let start = DateTime::parse_from_rfc3339(&log.start_time)
                .map_err(|e| EngineError::ParseTime(e.to_string()))?
                .with_timezone(&Utc);

            let end = match log.end_time {
                Some(ref end_str) => DateTime::parse_from_rfc3339(end_str)
                    .map_err(|e| EngineError::ParseTime(e.to_string()))?
                    .with_timezone(&Utc),
                None => now,
            };

            let effective_start = match range_start {
                Some(rs) => std::cmp::max(start, rs),
                None => start,
            };

            let effective_end = match range_end {
                Some(re) => std::cmp::min(end, re),
                None => end,
            };

            if effective_end > effective_start {
                let diff = effective_end.signed_duration_since(effective_start);
                total_duration += Duration::from_secs(diff.num_seconds() as u64);
            }
        }

        Ok(total_duration)
    }

    pub fn get_project_statistics(
        &self,
        project_id: &str,
    ) -> Result<ProjectStatistics, EngineError> {
        let elapsed = self.calculate_project_elapsed(project_id)?;
        let tasks = self.persistence.projects.get_tasks(project_id)?;

        let mut total_tasks = 0;
        let mut completed_tasks = 0;

        for task in &tasks {
            total_tasks += 1;
            if task.completed {
                completed_tasks += 1;
            }
            let subtasks = self.persistence.tasks.get_subtasks(&task.id)?;
            for subtask in subtasks {
                total_tasks += 1;
                if subtask.completed {
                    completed_tasks += 1;
                }
            }
        }

        Ok(ProjectStatistics {
            total_duration_sec: elapsed.as_secs(),
            total_tasks,
            completed_tasks,
        })
    }
}
