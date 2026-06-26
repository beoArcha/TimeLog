use super::cache::PersistenceCache;
use super::error::{PersistenceError, PersistenceResult};
use crate::persistence::persistence_config::PersistenceConfig;
use crate::repositories::business::BusinessRepository;
use crate::repositories::config::ConfigRepository;
use crate::sinks::csv::CsvSink;
use crate::types::{PersistenceEvent, Project, Settings, Task, TimeLog};

pub struct PersistenceLayer {
    business_repo: BusinessRepository,
    config_repo: ConfigRepository,
    csv_sink: CsvSink,
    cache: PersistenceCache,
}

impl PersistenceLayer {
    pub fn new(
        config: &PersistenceConfig,
    ) -> Result<Self, crate::repositories::shared::errors::RepositoryError> {
        let business_repo = BusinessRepository::new(&config.db_path)?;
        let config_repo = ConfigRepository::new(&config.db_path)?;
        let csv_sink = CsvSink::new(&config.csv_directory);
        let cache = PersistenceCache::new();

        Ok(Self {
            business_repo,
            config_repo,
            csv_sink,
            cache,
        })
    }

    fn execute_write<F, E>(&self, db_op: F, event: PersistenceEvent) -> PersistenceResult<()>
    where
        F: FnOnce() -> Result<(), E>,
        PersistenceError: From<E>,
    {
        db_op()?;
        self.cache.clear();
        self.csv_sink.emit(&event);
        Ok(())
    }

    pub fn create_project(&self, project: Project) -> PersistenceResult<()> {
        let event_project = project.clone();
        self.execute_write(
            move || self.business_repo.create_project(&project),
            PersistenceEvent::CreateProject(event_project),
        )
    }

    pub fn patch_project(&self, project: Project) -> PersistenceResult<()> {
        let event_project = project.clone();
        self.execute_write(
            move || self.business_repo.patch_project(&project),
            PersistenceEvent::PatchProject(event_project),
        )
    }

    pub fn archive_project(&self, id: String) -> PersistenceResult<()> {
        let event_id = id.clone();
        self.execute_write(
            move || self.business_repo.archive_project(&id),
            PersistenceEvent::ArchiveProject(event_id),
        )
    }

    pub fn get_project(&self, id: &str) -> PersistenceResult<Option<Project>> {
        if let Some(project) = self.cache.get_project(id) {
            return Ok(Some(project));
        }
        let project_opt = self.business_repo.get_project(id)?;
        if let Some(ref project) = project_opt {
            self.cache.insert_project(id.to_string(), project.clone());
        }
        Ok(project_opt)
    }

    pub fn create_task(&self, task: Task) -> PersistenceResult<()> {
        let event_task = task.clone();
        self.execute_write(
            move || self.business_repo.create_task(&task),
            PersistenceEvent::CreateTask(event_task),
        )
    }

    pub fn patch_task(&self, task: Task) -> PersistenceResult<()> {
        let event_task = task.clone();
        self.execute_write(
            move || self.business_repo.patch_task(&task),
            PersistenceEvent::PatchTask(event_task),
        )
    }

    pub fn archive_task(&self, id: String, project_id: String) -> PersistenceResult<()> {
        let event_id = id.clone();
        let event_project_id = project_id.clone();
        self.execute_write(
            move || self.business_repo.archive_task(&id),
            PersistenceEvent::ArchiveTask {
                task_id: event_id,
                project_id: event_project_id,
            },
        )
    }

    pub fn get_task(&self, id: &str) -> PersistenceResult<Option<Task>> {
        if let Some(task) = self.cache.get_task(id) {
            return Ok(Some(task));
        }
        let task_opt = self.business_repo.get_task(id)?;
        if let Some(ref task) = task_opt {
            self.cache.insert_task(id.to_string(), task.clone());
        }
        Ok(task_opt)
    }

    pub fn create_subtask(&self, task: Task) -> PersistenceResult<()> {
        let event_task = task.clone();
        self.execute_write(
            move || self.business_repo.create_subtask(&task),
            PersistenceEvent::CreateSubtask(event_task),
        )
    }

    pub fn patch_subtask(&self, task: Task) -> PersistenceResult<()> {
        let event_task = task.clone();
        self.execute_write(
            move || self.business_repo.patch_subtask(&task),
            PersistenceEvent::PatchSubtask(event_task),
        )
    }

    pub fn archive_subtask(&self, id: String, project_id: String) -> PersistenceResult<()> {
        let event_id = id.clone();
        let event_project_id = project_id.clone();
        self.execute_write(
            move || self.business_repo.archive_subtask(&id),
            PersistenceEvent::ArchiveSubtask {
                subtask_id: event_id,
                project_id: event_project_id,
            },
        )
    }

    pub fn get_config(&self) -> PersistenceResult<Settings> {
        let config = self.config_repo.get_config()?;
        Ok(config)
    }

    pub fn save_config(&self, settings: Settings) -> PersistenceResult<()> {
        self.config_repo.save_config(&settings)?;
        Ok(())
    }

    pub fn get_tasks_for_project(&self, project_id: &str) -> PersistenceResult<Vec<Task>> {
        if let Some(tasks) = self.cache.get_tasks_for_project(project_id) {
            return Ok(tasks);
        }
        let tasks = self.business_repo.get_tasks_for_project(project_id)?;
        self.cache
            .insert_tasks_for_project(project_id.to_string(), tasks.clone());
        Ok(tasks)
    }

    pub fn get_subtasks_for_task(&self, task_id: &str) -> PersistenceResult<Vec<Task>> {
        if let Some(subtasks) = self.cache.get_subtasks_for_task(task_id) {
            return Ok(subtasks);
        }
        let subtasks = self.business_repo.get_subtasks_for_task(task_id)?;
        self.cache
            .insert_subtasks_for_task(task_id.to_string(), subtasks.clone());
        Ok(subtasks)
    }

    pub fn get_time_logs_for_task(&self, task_id: &str) -> PersistenceResult<Vec<TimeLog>> {
        if let Some(logs) = self.cache.get_time_logs_for_task(task_id) {
            return Ok(logs);
        }
        let logs = self.business_repo.get_time_logs_for_task(task_id)?;
        self.cache
            .insert_time_logs_for_task(task_id.to_string(), logs.clone());
        Ok(logs)
    }

    pub fn get_project_id_by_task_id(&self, task_id: &str) -> PersistenceResult<String> {
        Ok(self.business_repo.get_project_id_by_task_id(task_id)?)
    }

    pub fn close_active_logs_by_project(
        &self,
        end_time: &str,
        project_id: &str,
    ) -> PersistenceResult<()> {
        self.business_repo
            .close_active_logs_by_project(end_time, project_id)?;
        self.cache.clear();
        Ok(())
    }

    pub fn close_all_active_logs(&self, end_time: &str) -> PersistenceResult<()> {
        self.business_repo.close_all_active_logs(end_time)?;
        self.cache.clear();
        Ok(())
    }

    pub fn insert_time_log(
        &self,
        log_id: &str,
        task_id: &str,
        start_time: &str,
    ) -> PersistenceResult<()> {
        self.business_repo
            .insert_time_log(log_id, task_id, start_time)?;
        self.cache.clear();
        Ok(())
    }

    pub fn query_active_logs(&self) -> PersistenceResult<Vec<String>> {
        Ok(self.business_repo.query_active_logs()?)
    }

    pub fn get_all_projects(&self) -> PersistenceResult<Vec<Project>> {
        Ok(self.business_repo.get_all_projects()?)
    }

    pub fn get_all_tasks(&self) -> PersistenceResult<Vec<Task>> {
        Ok(self.business_repo.get_all_tasks()?)
    }

    pub fn get_all_time_logs(&self) -> PersistenceResult<Vec<TimeLog>> {
        Ok(self.business_repo.get_all_time_logs()?)
    }

    pub fn clear_all_data(&self) -> PersistenceResult<()> {
        self.business_repo.clear_all_data()?;
        self.cache.clear();
        Ok(())
    }
}
