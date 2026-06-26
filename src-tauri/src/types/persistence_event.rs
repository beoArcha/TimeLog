use crate::types::{Project, Task};

#[derive(Debug, Clone)]
pub enum PersistenceEvent {
    CreateProject(Project),
    PatchProject(Project),
    ArchiveProject(String),
    CreateTask(Task),
    PatchTask(Task),
    ArchiveTask {
        task_id: String,
        project_id: String,
    },
    CreateSubtask(Task),
    PatchSubtask(Task),
    ArchiveSubtask {
        subtask_id: String,
        project_id: String,
    },
}
