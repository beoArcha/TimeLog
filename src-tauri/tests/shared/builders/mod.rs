#![allow(dead_code)]

use oxy_flow::types::{Project, Task, TaskStatus, TimeLog, WorkflowConfig};

/// Test Data Builder for `Project` domain entity.
pub struct ProjectBuilder {
    project: Project,
}

impl Default for ProjectBuilder {
    fn default() -> Self {
        Self {
            project: Project {
                id: "p_builder_1".to_string(),
                name: "Builder Project".to_string(),
                color: "indigo".to_string(),
                created_at: "2026-06-15T00:00:00Z".to_string(),
                archived: Some(false),
                original_name: None,
                original_color: None,
                edit_history: None,
                description: None,
                icon: None,
                tags: None,
                allow_concurrency: None,
            },
        }
    }
}

impl ProjectBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_id(mut self, id: impl Into<String>) -> Self {
        self.project.id = id.into();
        self
    }

    pub fn with_name(mut self, name: impl Into<String>) -> Self {
        self.project.name = name.into();
        self
    }

    pub fn with_color(mut self, color: impl Into<String>) -> Self {
        self.project.color = color.into();
        self
    }

    pub fn with_created_at(mut self, created_at: impl Into<String>) -> Self {
        self.project.created_at = created_at.into();
        self
    }

    pub fn with_description(mut self, description: impl Into<String>) -> Self {
        self.project.description = Some(description.into());
        self
    }

    pub fn with_icon(mut self, icon: impl Into<String>) -> Self {
        self.project.icon = Some(icon.into());
        self
    }

    pub fn with_tags(mut self, tags: Vec<String>) -> Self {
        self.project.tags = Some(tags);
        self
    }

    pub fn archived(mut self, is_archived: bool) -> Self {
        self.project.archived = Some(is_archived);
        self
    }

    pub fn with_allow_concurrency(mut self, allow: bool) -> Self {
        self.project.allow_concurrency = Some(allow);
        self
    }

    pub fn build(self) -> Project {
        self.project
    }
}

/// Test Data Builder for `Task` domain entity.
pub struct TaskBuilder {
    task: Task,
}

impl Default for TaskBuilder {
    fn default() -> Self {
        Self {
            task: Task {
                id: "t_builder_1".to_string(),
                project_id: "p_builder_1".to_string(),
                parent_task_id: None,
                name: "Builder Task".to_string(),
                completed: false,
                created_at: "2026-06-15T00:00:00Z".to_string(),
                status: Some(TaskStatus::Todo),
                original_name: None,
                original_completed: None,
                edit_history: None,
                archived: Some(false),
            },
        }
    }
}

impl TaskBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_id(mut self, id: impl Into<String>) -> Self {
        self.task.id = id.into();
        self
    }

    pub fn with_project_id(mut self, project_id: impl Into<String>) -> Self {
        self.task.project_id = project_id.into();
        self
    }

    pub fn with_name(mut self, name: impl Into<String>) -> Self {
        self.task.name = name.into();
        self
    }

    pub fn with_parent(mut self, parent_id: impl Into<String>) -> Self {
        self.task.parent_task_id = Some(parent_id.into());
        self
    }

    pub fn with_status(mut self, status: TaskStatus) -> Self {
        self.task.status = Some(status);
        self
    }

    pub fn with_created_at(mut self, created_at: impl Into<String>) -> Self {
        self.task.created_at = created_at.into();
        self
    }

    pub fn completed(mut self, is_completed: bool) -> Self {
        self.task.completed = is_completed;
        if is_completed {
            self.task.status = Some(TaskStatus::Done);
        }
        self
    }

    pub fn build(self) -> Task {
        self.task
    }
}

/// Test Data Builder for `TimeLog` domain entity.
pub struct TimeLogBuilder {
    log: TimeLog,
}

impl Default for TimeLogBuilder {
    fn default() -> Self {
        Self {
            log: TimeLog {
                id: "l_builder_1".to_string(),
                project_id: "p_builder_1".to_string(),
                task_id: "t_builder_1".to_string(),
                start_time: "2026-06-15T10:00:00Z".to_string(),
                end_time: Some("2026-06-15T11:00:00Z".to_string()),
                note: None,
                edit_history: None,
            },
        }
    }
}

impl TimeLogBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_id(mut self, id: impl Into<String>) -> Self {
        self.log.id = id.into();
        self
    }

    pub fn with_project_id(mut self, project_id: impl Into<String>) -> Self {
        self.log.project_id = project_id.into();
        self
    }

    pub fn with_task_id(mut self, task_id: impl Into<String>) -> Self {
        self.log.task_id = task_id.into();
        self
    }

    pub fn with_start_time(mut self, start_time: impl Into<String>) -> Self {
        self.log.start_time = start_time.into();
        self
    }

    pub fn with_end_time(mut self, end_time: Option<String>) -> Self {
        self.log.end_time = end_time;
        self
    }

    pub fn running(mut self) -> Self {
        self.log.end_time = None;
        self
    }

    pub fn with_note(mut self, note: impl Into<String>) -> Self {
        self.log.note = Some(note.into());
        self
    }

    pub fn with_edit_history(mut self, history: Vec<oxy_flow::types::TimeLogEditHistory>) -> Self {
        self.log.edit_history = Some(history);
        self
    }

    pub fn build(self) -> TimeLog {
        self.log
    }
}

/// Test Data Builder for `WorkflowConfig`.
#[derive(Default)]
pub struct WorkflowConfigBuilder {
    config: WorkflowConfig,
}

impl WorkflowConfigBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_hours_limit(mut self, enabled: bool, hours: f64) -> Self {
        self.config.auto_stop_hours_limit_enabled = enabled;
        self.config.auto_stop_hours_limit = hours;
        self
    }

    pub fn with_daily_boundary(mut self, enabled: bool, boundary_time: impl Into<String>) -> Self {
        self.config.auto_stop_daily_boundary_enabled = enabled;
        self.config.auto_stop_daily_boundary_time = boundary_time.into();
        self
    }

    pub fn with_stop_on_complete(mut self, enabled: bool) -> Self {
        self.config.auto_stop_on_task_complete = enabled;
        self
    }

    pub fn with_warning(mut self, enabled: bool) -> Self {
        self.config.warning_notification_enabled = enabled;
        self
    }

    pub fn build(self) -> WorkflowConfig {
        self.config
    }
}
