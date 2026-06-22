use crate::types::PersistenceEvent;
use chrono::Utc;
use std::fs::OpenOptions;
use std::path::{Path, PathBuf};

pub struct CsvSink {
    directory: PathBuf,
}

impl CsvSink {
    pub fn new(directory: &Path) -> Self {
        Self {
            directory: directory.to_path_buf(),
        }
    }

    pub fn emit(&self, event: &PersistenceEvent) {
        if let Err(e) = self.try_emit(event) {
            eprintln!("Warning: CsvSink failed to emit event: {}", e);
        }
    }

    fn try_emit(&self, event: &PersistenceEvent) -> Result<(), Box<dyn std::error::Error>> {
        std::fs::create_dir_all(&self.directory)?;

        let project_id = match event {
            PersistenceEvent::CreateProject(p) | PersistenceEvent::PatchProject(p) => &p.id,
            PersistenceEvent::ArchiveProject(id) => id,
            PersistenceEvent::CreateTask(t)
            | PersistenceEvent::PatchTask(t)
            | PersistenceEvent::CreateSubtask(t)
            | PersistenceEvent::PatchSubtask(t) => &t.project_id,
            PersistenceEvent::ArchiveTask { project_id, .. }
            | PersistenceEvent::ArchiveSubtask { project_id, .. } => project_id,
        };

        let file_name = format!("timelog_{}.csv", project_id);
        let file_path = self.directory.join(file_name);

        let file_exists = file_path.exists();
        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&file_path)?;

        let mut wtr = csv::WriterBuilder::new()
            .has_headers(!file_exists)
            .from_writer(file);

        if !file_exists {
            wtr.write_record([
                "timestamp",
                "event",
                "entity",
                "entity_id",
                "parent_id",
                "name",
                "sha",
                "source",
                "correlation_id",
            ])?;
        }

        let timestamp = Utc::now().to_rfc3339();

        let (event_name, entity, entity_id, parent_id, name) = match event {
            PersistenceEvent::CreateProject(p) => (
                "create",
                "project",
                p.id.as_str(),
                None,
                Some(p.name.as_str()),
            ),
            PersistenceEvent::PatchProject(p) => (
                "patch",
                "project",
                p.id.as_str(),
                None,
                Some(p.name.as_str()),
            ),
            PersistenceEvent::ArchiveProject(id) => ("archive", "project", id.as_str(), None, None),
            PersistenceEvent::CreateTask(t) => (
                "create",
                "task",
                t.id.as_str(),
                t.parent_task_id.as_deref(),
                Some(t.name.as_str()),
            ),
            PersistenceEvent::PatchTask(t) => (
                "patch",
                "task",
                t.id.as_str(),
                t.parent_task_id.as_deref(),
                Some(t.name.as_str()),
            ),
            PersistenceEvent::ArchiveTask { task_id, .. } => {
                ("archive", "task", task_id.as_str(), None, None)
            }
            PersistenceEvent::CreateSubtask(t) => (
                "create",
                "subtask",
                t.id.as_str(),
                t.parent_task_id.as_deref(),
                Some(t.name.as_str()),
            ),
            PersistenceEvent::PatchSubtask(t) => (
                "patch",
                "subtask",
                t.id.as_str(),
                t.parent_task_id.as_deref(),
                Some(t.name.as_str()),
            ),
            PersistenceEvent::ArchiveSubtask { subtask_id, .. } => {
                ("archive", "subtask", subtask_id.as_str(), None, None)
            }
        };

        wtr.write_record([
            timestamp.as_str(),
            event_name,
            entity,
            entity_id,
            parent_id.unwrap_or(""),
            name.unwrap_or(""),
            "", // sha
            "", // source
            "", // correlation_id
        ])?;

        wtr.flush()?;
        Ok(())
    }
}
