use crate::persistence::{PersistenceError, PersistenceLayer};
use chrono::{DateTime, Utc};
use std::time::Duration;

static LOG_COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);

#[derive(thiserror::Error, Debug)]
pub enum EngineError {
    #[error("Persistence error: {0}")]
    Persistence(#[from] PersistenceError),
    #[error("Parse time error: {0}")]
    ParseTime(String),
}

pub struct Engine<'a> {
    persistence: &'a PersistenceLayer,
}

impl<'a> Engine<'a> {
    pub fn new(persistence: &'a PersistenceLayer) -> Self {
        Self { persistence }
    }

    pub fn calculate_subtask_elapsed(&self, subtask_id: &str) -> Result<Duration, EngineError> {
        let logs = self.persistence.core.get_time_logs_for_task(subtask_id)?;
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
        let logs = self.persistence.core.get_time_logs_for_task(task_id)?;
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

        let subtasks = self.persistence.tasks.get_subtasks_for_task(task_id)?;
        for subtask in subtasks {
            total_duration += self.calculate_subtask_elapsed(&subtask.id)?;
        }

        Ok(total_duration)
    }

    pub fn calculate_project_elapsed(&self, project_id: &str) -> Result<Duration, EngineError> {
        let parent_tasks = self.persistence.projects.get_tasks_for_project(project_id)?;
        let mut total_duration = Duration::ZERO;

        for task in parent_tasks {
            total_duration += self.calculate_task_elapsed(&task.id)?;
        }

        Ok(total_duration)
    }

    pub fn start_timer(&self, task_id: &str) -> Result<(), EngineError> {
        let proj_id = self.persistence.tasks.get_project_id_by_task_id(task_id)?;

        let now = Utc::now().to_rfc3339();
        self.persistence
            .core
            .close_active_logs_by_project(&now, &proj_id)?;

        let log_id = format!(
            "log_{}_{}",
            Utc::now().timestamp_millis(),
            LOG_COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst)
        );

        self.persistence.core.insert_time_log(&log_id, task_id, &now)?;
        Ok(())
    }

    pub fn stop_timer(&self, project_id: Option<&str>) -> Result<(), EngineError> {
        let now = Utc::now().to_rfc3339();
        match project_id {
            Some(p_id) => {
                self.persistence.core.close_active_logs_by_project(&now, p_id)?;
            }
            None => {
                self.persistence.core.close_all_active_logs(&now)?;
            }
        }
        Ok(())
    }

    pub fn get_active_logs(&self) -> Result<Vec<String>, EngineError> {
        let ids = self.persistence.core.query_active_logs()?;
        Ok(ids)
    }

    pub fn get_state(&self) -> Result<crate::types::TimerRepositoryState, EngineError> {
        let projects = self.persistence.projects.get_all_projects()?;
        let tasks = self.persistence.tasks.get_all_tasks()?;
        let logs = self.persistence.core.get_all_time_logs()?;

        let active_task_ids = self.persistence.core.query_active_logs()?;
        let active_log = if !active_task_ids.is_empty() {
            logs.iter()
                .find(|l| l.end_time.is_none() && active_task_ids.contains(&l.task_id))
                .cloned()
        } else {
            None
        };

        Ok(crate::types::TimerRepositoryState {
            projects,
            tasks,
            logs,
            active_log,
        })
    }

    pub fn add_project(&self, name: String, color: String) -> Result<(), EngineError> {
        let project = crate::types::Project {
            id: format!("proj_{}", chrono::Utc::now().timestamp_millis()),
            name,
            color,
            created_at: chrono::Utc::now().to_rfc3339(),
            archived: Some(false),
            original_name: None,
            original_color: None,
            edit_history: None,
        };
        self.persistence.projects.create_project(project)?;
        Ok(())
    }

    pub fn toggle_project_archive(&self, project_id: String) -> Result<(), EngineError> {
        if let Some(mut project) = self.persistence.projects.get_project(&project_id)? {
            let archived = project.archived.unwrap_or(false);
            project.archived = Some(!archived);
            self.persistence.projects.patch_project(project)?;
        }
        Ok(())
    }

    pub fn add_task(
        &self,
        project_id: String,
        name: String,
        parent_task_id: Option<String>,
    ) -> Result<(), EngineError> {
        let task = crate::types::Task {
            id: format!("task_{}", chrono::Utc::now().timestamp_millis()),
            project_id,
            parent_task_id,
            name,
            created_at: chrono::Utc::now().to_rfc3339(),
            completed: false,
            original_name: None,
            original_completed: None,
            edit_history: None,
            archived: Some(false),
        };
        if task.parent_task_id.is_some() {
            self.persistence.tasks.create_subtask(task)?;
        } else {
            self.persistence.tasks.create_task(task)?;
        }
        Ok(())
    }

    pub fn rename_project(&self, project_id: String, name: String) -> Result<(), EngineError> {
        if let Some(mut project) = self.persistence.projects.get_project(&project_id)? {
            project.name = name;
            self.persistence.projects.patch_project(project)?;
        }
        Ok(())
    }

    pub fn rename_task(&self, task_id: String, name: String) -> Result<(), EngineError> {
        if let Some(mut task) = self.persistence.tasks.get_task(&task_id)? {
            task.name = name;
            self.persistence.tasks.patch_task(task)?;
        }
        Ok(())
    }

    pub fn delete_task(&self, task_id: String) -> Result<(), EngineError> {
        if let Some(task) = self.persistence.tasks.get_task(&task_id)? {
            if task.parent_task_id.is_some() {
                self.persistence.tasks.archive_subtask(task_id, task.project_id)?;
            } else {
                self.persistence.tasks.archive_task(task_id, task.project_id)?;
            }
        }
        Ok(())
    }

    pub fn toggle_task_complete(&self, task_id: String) -> Result<(), EngineError> {
        if let Some(mut task) = self.persistence.tasks.get_task(&task_id)? {
            task.completed = !task.completed;
            self.persistence.tasks.patch_task(task)?;
        }
        Ok(())
    }

    pub fn reset_database(&self) -> Result<(), EngineError> {
        self.persistence.core.clear_all_data()?;
        Ok(())
    }
}
