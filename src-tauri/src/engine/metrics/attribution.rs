use crate::types::Task;
use std::collections::HashMap;

/// Resolves which project an interval is attributed to, matching the report builder and billing.
pub(crate) struct TaskProjectIndex<'a> {
    project_by_task: HashMap<&'a str, &'a str>,
}

impl<'a> TaskProjectIndex<'a> {
    pub(crate) fn new(tasks: &'a [Task]) -> Self {
        Self {
            project_by_task: tasks
                .iter()
                .map(|task| (task.id.as_str(), task.project_id.as_str()))
                .collect(),
        }
    }

    /// The task's current project wins because moving a task re-homes its history; the
    /// interval's own project is a fallback for orphaned or task-less entries only.
    pub(crate) fn resolve<'b>(&self, task_id: Option<&str>, own_project_id: &'b str) -> &'b str
    where
        'a: 'b,
    {
        task_id
            .and_then(|id| self.project_by_task.get(id).copied())
            .unwrap_or(own_project_id)
    }
}
