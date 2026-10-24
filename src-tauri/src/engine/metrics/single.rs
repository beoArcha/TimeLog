use crate::engine::{Engine, EngineError};
use crate::types::{ProjectStatistics, TimeLog};
use chrono::{DateTime, Utc};
use std::time::Duration;

impl<'a> Engine<'a> {
    pub fn calculate_log_elapsed(log: &TimeLog) -> Result<Duration, EngineError> {
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
            Ok(Duration::from_secs(diff.num_seconds() as u64))
        } else {
            Ok(Duration::ZERO)
        }
    }

    pub fn calculate_subtask_elapsed(&self, subtask_id: &str) -> Result<Duration, EngineError> {
        let logs = self.persistence.time_logs.get_for_task(subtask_id)?;
        let mut total_duration = Duration::ZERO;

        for log in &logs {
            total_duration += Self::calculate_log_elapsed(log)?;
        }

        Ok(total_duration)
    }

    pub fn calculate_task_elapsed(&self, task_id: &str) -> Result<Duration, EngineError> {
        let logs = self.persistence.time_logs.get_for_task(task_id)?;
        let mut total_duration = Duration::ZERO;

        for log in &logs {
            total_duration += Self::calculate_log_elapsed(log)?;
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
