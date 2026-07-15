use super::constants;
use super::BusinessRepository;
use crate::repositories::shared::errors::RepositoryError;
use crate::repositories::shared::errors::Result;
use crate::types::{Task, TaskEditHistory};
use rusqlite::params;

impl BusinessRepository {
    pub fn create_task(&self, task: &Task) -> Result<()> {
        let conn = self.connect()?;
        let edit_history_str = serde_json::to_string(&task.edit_history).ok();
        let status_str = serde_json::to_string(
            &task
                .status
                .clone()
                .unwrap_or(crate::types::TaskStatus::Todo),
        )
        .unwrap_or_else(|_| "\"Todo\"".to_string())
        .trim_matches('"')
        .to_string();
        conn.execute(
            constants::INSERT_TASK,
            params![
                task.id,
                task.project_id,
                task.parent_task_id,
                task.name,
                task.completed as i32,
                task.created_at,
                task.original_name,
                task.original_completed.unwrap_or(false) as i32,
                edit_history_str,
                task.archived.unwrap_or(false) as i32,
                status_str
            ],
        )?;
        Ok(())
    }

    pub fn patch_task(&self, task: &Task) -> Result<()> {
        let conn = self.connect()?;
        let edit_history_str = serde_json::to_string(&task.edit_history).ok();
        let status_str = serde_json::to_string(
            &task
                .status
                .clone()
                .unwrap_or(crate::types::TaskStatus::Todo),
        )
        .unwrap_or_else(|_| "\"Todo\"".to_string())
        .trim_matches('"')
        .to_string();
        conn.execute(
            constants::UPDATE_TASK,
            params![
                task.id,
                task.project_id,
                task.parent_task_id,
                task.name,
                task.completed as i32,
                task.original_name,
                task.original_completed.unwrap_or(false) as i32,
                edit_history_str,
                task.archived.unwrap_or(false) as i32,
                status_str
            ],
        )?;
        Ok(())
    }

    pub fn archive_task(&self, id: &str) -> Result<()> {
        let conn = self.connect()?;
        conn.execute(constants::ARCHIVE_TASK, params![id])?;
        Ok(())
    }

    fn map_task_row(row: &rusqlite::Row) -> rusqlite::Result<Task> {
        let edit_history_str: Option<String> = row.get(8)?;
        let edit_history: Option<Vec<TaskEditHistory>> =
            edit_history_str.and_then(|s| serde_json::from_str(&s).ok());
        let completed_int: i32 = row.get(4)?;
        let orig_comp_int: Option<i32> = row.get(7)?;
        let archived_int: i32 = row.get(9)?;
        let status_str: Option<String> = row.get(10)?;
        let status: Option<crate::types::TaskStatus> =
            status_str.and_then(|s| serde_json::from_str(&format!("\"{}\"", s)).ok());

        Ok(Task {
            id: row.get(0)?,
            project_id: row.get(1)?,
            parent_task_id: row.get(2)?,
            name: row.get(3)?,
            completed: completed_int == 1,
            created_at: row.get(5)?,
            original_name: row.get(6)?,
            original_completed: orig_comp_int.map(|c| c == 1),
            edit_history,
            archived: Some(archived_int == 1),
            status,
        })
    }

    pub fn get_task(&self, id: &str) -> Result<Option<Task>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_TASK_BY_ID)?;
        let mut rows = stmt.query(params![id])?;
        match rows.next()? {
            Some(row) => Ok(Some(Self::map_task_row(row)?)),
            None => Ok(None),
        }
    }

    pub fn create_subtask(&self, task: &Task) -> Result<()> {
        if task.parent_task_id.is_none() {
            return Err(RepositoryError::Validation(
                "Subtask must have a parent_task_id".to_string(),
            ));
        }
        self.create_task(task)
    }

    pub fn patch_subtask(&self, task: &Task) -> Result<()> {
        if task.parent_task_id.is_none() {
            return Err(RepositoryError::Validation(
                "Subtask must have a parent_task_id".to_string(),
            ));
        }
        self.patch_task(task)
    }

    pub fn archive_subtask(&self, id: &str) -> Result<()> {
        self.archive_task(id)
    }

    pub fn get_tasks_for_project(&self, project_id: &str) -> Result<Vec<Task>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_TASKS_BY_PROJECT)?;
        let rows = stmt.query_map(params![project_id], Self::map_task_row)?;
        let mut tasks = Vec::new();
        for r in rows {
            tasks.push(r?);
        }
        Ok(tasks)
    }

    pub fn get_subtasks_for_task(&self, task_id: &str) -> Result<Vec<Task>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_SUBTASKS_BY_PARENT)?;
        let rows = stmt.query_map(params![task_id], Self::map_task_row)?;
        let mut tasks = Vec::new();
        for r in rows {
            tasks.push(r?);
        }
        Ok(tasks)
    }

    pub fn get_all_tasks(&self) -> Result<Vec<Task>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_ALL_TASKS)?;
        let rows = stmt.query_map([], Self::map_task_row)?;
        let mut tasks = Vec::new();
        for r in rows {
            tasks.push(r?);
        }
        Ok(tasks)
    }
}
