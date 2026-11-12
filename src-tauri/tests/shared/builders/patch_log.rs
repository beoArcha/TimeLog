#![allow(dead_code)]

use oxyflow_timelog::types::PatchLog;

/// Test Data Builder for `PatchLog`; defaults to a task-less patch on the default builder project.
pub struct PatchLogBuilder {
    patch: PatchLog,
}

impl Default for PatchLogBuilder {
    fn default() -> Self {
        Self {
            patch: PatchLog {
                id: "pl_builder_1".to_string(),
                project_id: "p_builder_1".to_string(),
                task_id: None,
                start_time: "2026-06-15T10:00:00Z".to_string(),
                end_time: "2026-06-15T11:00:00Z".to_string(),
                patch_note: "Builder patch".to_string(),
                is_system_event: None,
            },
        }
    }
}

impl PatchLogBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_id(mut self, id: impl Into<String>) -> Self {
        self.patch.id = id.into();
        self
    }

    pub fn with_project_id(mut self, project_id: impl Into<String>) -> Self {
        self.patch.project_id = project_id.into();
        self
    }

    pub fn with_task_id(mut self, task_id: impl Into<String>) -> Self {
        self.patch.task_id = Some(task_id.into());
        self
    }

    pub fn with_start_time(mut self, start_time: impl Into<String>) -> Self {
        self.patch.start_time = start_time.into();
        self
    }

    pub fn with_end_time(mut self, end_time: impl Into<String>) -> Self {
        self.patch.end_time = end_time.into();
        self
    }

    pub fn with_note(mut self, note: impl Into<String>) -> Self {
        self.patch.patch_note = note.into();
        self
    }

    pub fn build(self) -> PatchLog {
        self.patch
    }
}
