use std::sync::Arc;
use super::persistence_shared::PersistenceShared;
use super::error::PersistenceResult;
use crate::types::{Task, PersistenceEvent};

pub struct TasksPersistence {
    shared: Arc<PersistenceShared>,
}

impl TasksPersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn create_task(&self, task: Task) -> PersistenceResult<()> {
        let event_task = task.clone();
        self.shared.execute_write(
            move || self.shared.business_repo.create_task(&task),
            PersistenceEvent::CreateTask(event_task),
        )
    }

    pub fn patch_task(&self, task: Task) -> PersistenceResult<()> {
        let event_task = task.clone();
        self.shared.execute_write(
            move || self.shared.business_repo.patch_task(&task),
            PersistenceEvent::PatchTask(event_task),
        )
    }

    pub fn archive_task(&self, id: String, project_id: String) -> PersistenceResult<()> {
        let event_id = id.clone();
        let event_project_id = project_id.clone();
        self.shared.execute_write(
            move || self.shared.business_repo.archive_task(&id),
            PersistenceEvent::ArchiveTask {
                task_id: event_id,
                project_id: event_project_id,
            },
        )
    }

    pub fn get_task(&self, id: &str) -> PersistenceResult<Option<Task>> {
        if let Some(task) = self.shared.cache.get_task(id) {
            return Ok(Some(task));
        }
        let task_opt = self.shared.business_repo.get_task(id)?;
        if let Some(ref task) = task_opt {
            self.shared.cache.insert_task(id.to_string(), task.clone());
        }
        Ok(task_opt)
    }

    pub fn create_subtask(&self, task: Task) -> PersistenceResult<()> {
        let event_task = task.clone();
        self.shared.execute_write(
            move || self.shared.business_repo.create_subtask(&task),
            PersistenceEvent::CreateSubtask(event_task),
        )
    }

    pub fn patch_subtask(&self, task: Task) -> PersistenceResult<()> {
        let event_task = task.clone();
        self.shared.execute_write(
            move || self.shared.business_repo.patch_subtask(&task),
            PersistenceEvent::PatchSubtask(event_task),
        )
    }

    pub fn archive_subtask(&self, id: String, project_id: String) -> PersistenceResult<()> {
        let event_id = id.clone();
        let event_project_id = project_id.clone();
        self.shared.execute_write(
            move || self.shared.business_repo.archive_subtask(&id),
            PersistenceEvent::ArchiveSubtask {
                subtask_id: event_id,
                project_id: event_project_id,
            },
        )
    }

    pub fn get_subtasks_for_task(&self, task_id: &str) -> PersistenceResult<Vec<Task>> {
        if let Some(subtasks) = self.shared.cache.get_subtasks_for_task(task_id) {
            return Ok(subtasks);
        }
        let subtasks = self.shared.business_repo.get_subtasks_for_task(task_id)?;
        self.shared.cache
            .insert_subtasks_for_task(task_id.to_string(), subtasks.clone());
        Ok(subtasks)
    }

    pub fn get_project_id_by_task_id(&self, task_id: &str) -> PersistenceResult<String> {
        Ok(self.shared.business_repo.get_project_id_by_task_id(task_id)?)
    }

    pub fn get_all_tasks(&self) -> PersistenceResult<Vec<Task>> {
        Ok(self.shared.business_repo.get_all_tasks()?)
    }
}
