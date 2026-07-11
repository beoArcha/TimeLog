use super::error::PersistenceResult;
use super::shared::PersistenceShared;
use crate::types::{PersistenceEvent, Project, Task};
use std::sync::Arc;

pub struct ProjectsPersistence {
    shared: Arc<PersistenceShared>,
}

impl ProjectsPersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn create(&self, project: Project) -> PersistenceResult<()> {
        let event_project = project.clone();
        self.shared.execute_write(
            move || self.shared.business_repo.create_project(&project),
            PersistenceEvent::CreateProject(event_project),
        )
    }

    pub fn patch(&self, project: Project) -> PersistenceResult<()> {
        let event_project = project.clone();
        self.shared.execute_write(
            move || self.shared.business_repo.patch_project(&project),
            PersistenceEvent::PatchProject(event_project),
        )
    }

    pub fn archive(&self, id: String) -> PersistenceResult<()> {
        let event_id = id.clone();
        self.shared.execute_write(
            move || self.shared.business_repo.archive_project(&id),
            PersistenceEvent::ArchiveProject(event_id),
        )
    }

    pub fn get(&self, id: &str) -> PersistenceResult<Option<Project>> {
        if let Some(project) = self.shared.cache.get_project(id) {
            return Ok(Some(project));
        }
        let project_opt = self.shared.business_repo.get_project(id)?;
        if let Some(ref project) = project_opt {
            self.shared
                .cache
                .insert_project(id.to_string(), project.clone());
        }
        Ok(project_opt)
    }

    pub fn get_tasks(&self, project_id: &str) -> PersistenceResult<Vec<Task>> {
        if let Some(tasks) = self.shared.cache.get_tasks_for_project(project_id) {
            return Ok(tasks);
        }
        let tasks = self
            .shared
            .business_repo
            .get_tasks_for_project(project_id)?;
        self.shared
            .cache
            .insert_tasks_for_project(project_id.to_string(), tasks.clone());
        Ok(tasks)
    }

    pub fn get_all(&self) -> PersistenceResult<Vec<Project>> {
        Ok(self.shared.business_repo.get_all_projects()?)
    }
}
