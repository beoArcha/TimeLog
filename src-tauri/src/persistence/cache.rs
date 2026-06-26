use crate::types::{Project, Task, TimeLog};
use std::collections::HashMap;
use std::sync::RwLock;

#[derive(Default)]
struct InnerCache {
    projects: HashMap<String, Project>,
    tasks: HashMap<String, Task>,
    project_tasks: HashMap<String, Vec<Task>>,
    task_subtasks: HashMap<String, Vec<Task>>,
    task_logs: HashMap<String, Vec<TimeLog>>,
}

#[derive(Default)]
pub struct PersistenceCache {
    inner: RwLock<InnerCache>,
}

impl PersistenceCache {
    pub fn new() -> Self {
        Self {
            inner: RwLock::new(InnerCache::default()),
        }
    }

    pub fn clear(&self) {
        if let Ok(mut cache) = self.inner.write() {
            *cache = InnerCache::default();
        }
    }

    pub fn get_project(&self, id: &str) -> Option<Project> {
        self.inner.read().ok()?.projects.get(id).cloned()
    }

    pub fn insert_project(&self, id: String, project: Project) {
        if let Ok(mut cache) = self.inner.write() {
            cache.projects.insert(id, project);
        }
    }

    pub fn get_task(&self, id: &str) -> Option<Task> {
        self.inner.read().ok()?.tasks.get(id).cloned()
    }

    pub fn insert_task(&self, id: String, task: Task) {
        if let Ok(mut cache) = self.inner.write() {
            cache.tasks.insert(id, task);
        }
    }

    pub fn get_tasks_for_project(&self, project_id: &str) -> Option<Vec<Task>> {
        self.inner
            .read()
            .ok()?
            .project_tasks
            .get(project_id)
            .cloned()
    }

    pub fn insert_tasks_for_project(&self, project_id: String, tasks: Vec<Task>) {
        if let Ok(mut cache) = self.inner.write() {
            cache.project_tasks.insert(project_id, tasks);
        }
    }

    pub fn get_subtasks_for_task(&self, task_id: &str) -> Option<Vec<Task>> {
        self.inner.read().ok()?.task_subtasks.get(task_id).cloned()
    }

    pub fn insert_subtasks_for_task(&self, task_id: String, subtasks: Vec<Task>) {
        if let Ok(mut cache) = self.inner.write() {
            cache.task_subtasks.insert(task_id, subtasks);
        }
    }

    pub fn get_time_logs_for_task(&self, task_id: &str) -> Option<Vec<TimeLog>> {
        self.inner.read().ok()?.task_logs.get(task_id).cloned()
    }

    pub fn insert_time_logs_for_task(&self, task_id: String, logs: Vec<TimeLog>) {
        if let Ok(mut cache) = self.inner.write() {
            cache.task_logs.insert(task_id, logs);
        }
    }
}
