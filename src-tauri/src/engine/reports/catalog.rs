use super::constants::{ENTITY_PROJECT, ENTITY_TASK, MSG_TASK_HIERARCHY_CYCLE};
use crate::engine::EngineError;
use crate::types::{Project, Task};
use std::collections::HashMap;

/// Read-only lookups over one snapshot of projects and tasks.
pub(super) struct Catalog<'a> {
    projects: HashMap<&'a str, &'a Project>,
    tasks: HashMap<&'a str, &'a Task>,
    all_tasks: &'a [Task],
}

impl<'a> Catalog<'a> {
    pub(super) fn new(projects: &'a [Project], tasks: &'a [Task]) -> Self {
        Self {
            projects: projects.iter().map(|p| (p.id.as_str(), p)).collect(),
            tasks: tasks.iter().map(|t| (t.id.as_str(), t)).collect(),
            all_tasks: tasks,
        }
    }

    pub(super) fn project(&self, id: &str) -> Result<&'a Project, EngineError> {
        self.projects
            .get(id)
            .copied()
            .ok_or_else(|| not_found(ENTITY_PROJECT, id))
    }

    pub(super) fn task(&self, id: &str) -> Result<&'a Task, EngineError> {
        self.tasks
            .get(id)
            .copied()
            .ok_or_else(|| not_found(ENTITY_TASK, id))
    }

    pub(super) fn all_tasks(&self) -> &'a [Task] {
        self.all_tasks
    }

    /// The task itself first, its root last. The walk is bounded by the task count so corrupt
    /// parent links surface as an error instead of looping forever.
    pub(super) fn chain(&self, task_id: &str) -> Result<Vec<&'a Task>, EngineError> {
        let mut chain = vec![self.task(task_id)?];
        while let Some(parent_id) = chain.last().and_then(|t| t.parent_task_id.as_deref()) {
            if chain.len() > self.tasks.len() {
                return Err(EngineError::Validation(format!(
                    "{MSG_TASK_HIERARCHY_CYCLE} '{task_id}'"
                )));
            }
            chain.push(self.task(parent_id)?);
        }
        Ok(chain)
    }
}

fn not_found(entity: &'static str, id: &str) -> EngineError {
    EngineError::EntityNotFound {
        entity,
        id: id.to_string(),
    }
}
