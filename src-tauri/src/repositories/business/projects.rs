use super::constants;
use super::BusinessRepository;
use crate::repositories::shared::errors::{RepositoryError, Result};
use crate::types::{Project, ProjectEditHistory};
use rusqlite::{params, OptionalExtension};

impl BusinessRepository {
    pub fn create_project(&self, project: &Project) -> Result<()> {
        let conn = self.connect()?;
        let edit_history_str = project
            .edit_history
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;
        let tags_str = project
            .tags
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;
        conn.execute(
            constants::INSERT_PROJECT,
            params![
                project.id,
                project.name,
                project.color,
                project.created_at,
                project.archived.unwrap_or(false) as i32,
                project.original_name,
                project.original_color,
                edit_history_str,
                project.description,
                project.icon,
                tags_str,
                project.allow_concurrency.unwrap_or(false) as i32,
                project.hourly_rate,
                project.currency
            ],
        )?;
        Ok(())
    }

    pub fn patch_project(&self, project: &Project) -> Result<()> {
        let conn = self.connect()?;
        let edit_history_str = project
            .edit_history
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;
        let tags_str = project
            .tags
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;
        let affected = conn.execute(
            constants::UPDATE_PROJECT,
            params![
                project.id,
                project.name,
                project.color,
                project.archived.unwrap_or(false) as i32,
                project.original_name,
                project.original_color,
                edit_history_str,
                project.description,
                project.icon,
                tags_str,
                project.allow_concurrency.unwrap_or(false) as i32,
                project.hourly_rate,
                project.currency
            ],
        )?;
        if affected == 0 {
            return Err(RepositoryError::NotFound {
                entity: "Project",
                id: project.id.clone(),
            });
        }
        Ok(())
    }

    pub fn archive_project(&self, id: &str) -> Result<()> {
        let conn = self.connect()?;
        let affected = conn.execute(constants::ARCHIVE_PROJECT, params![id])?;
        if affected == 0 {
            return Err(RepositoryError::NotFound {
                entity: "Project",
                id: id.to_string(),
            });
        }
        Ok(())
    }

    fn map_project_row(row: &rusqlite::Row) -> rusqlite::Result<Project> {
        let edit_history_str: Option<String> = row.get(7)?;
        let edit_history: Option<Vec<ProjectEditHistory>> =
            crate::repositories::shared::parse_json_column(7, edit_history_str)?;
        let archived_int: i32 = row.get(4)?;
        let tags_str: Option<String> = row.get(10)?;
        let tags: Option<Vec<String>> =
            crate::repositories::shared::parse_json_column(10, tags_str)?;
        let allow_concurrency_int: Option<i32> = row.get(11)?;

        Ok(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            created_at: row.get(3)?,
            archived: Some(archived_int == 1),
            original_name: row.get(5)?,
            original_color: row.get(6)?,
            edit_history,
            description: row.get(8)?,
            icon: row.get(9)?,
            tags,
            allow_concurrency: allow_concurrency_int.map(|v| v == 1),
            hourly_rate: row.get(12)?,
            currency: row.get(13)?,
        })
    }

    pub fn get_project(&self, id: &str) -> Result<Option<Project>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_PROJECT_BY_ID)?;
        let mut rows = stmt.query(params![id])?;
        match rows.next()? {
            Some(row) => Ok(Some(Self::map_project_row(row)?)),
            None => Ok(None),
        }
    }

    pub fn get_all_projects(&self) -> Result<Vec<Project>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_ALL_PROJECTS)?;
        let rows = stmt.query_map([], Self::map_project_row)?;
        let mut projects = Vec::new();
        for r in rows {
            projects.push(r?);
        }
        Ok(projects)
    }

    pub fn clear_all_data(&self) -> Result<()> {
        let conn = self.connect()?;
        conn.execute(constants::DELETE_ALL_TIME_LOGS, [])?;
        conn.execute(constants::DELETE_ALL_TASKS, [])?;
        conn.execute(constants::DELETE_ALL_PROJECTS, [])?;
        Ok(())
    }

    pub fn delete_project(&self, id: &str) -> Result<()> {
        let mut conn = self.connect()?;
        let tx = conn.transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;

        let project_exists: bool = tx
            .query_row(constants::SELECT_PROJECT_BY_ID, params![id], |_| Ok(true))
            .optional()?
            .unwrap_or(false);

        if !project_exists {
            return Err(RepositoryError::NotFound {
                entity: "Project",
                id: id.to_string(),
            });
        }

        let active_count: i64 =
            tx.query_row(constants::COUNT_PROJECT_ACTIVE_TIMERS, params![id], |row| {
                row.get(0)
            })?;

        if active_count > 0 {
            return Err(RepositoryError::Validation(
                "Cannot delete project with active timer. Stop timer first".to_string(),
            ));
        }

        let logs_count: i64 =
            tx.query_row(constants::COUNT_PROJECT_LOGGED_TIME, params![id], |row| {
                row.get(0)
            })?;

        if logs_count > 0 {
            return Err(RepositoryError::Validation(
                "Cannot delete project with logged time".to_string(),
            ));
        }

        tx.execute(constants::DELETE_SUBTASKS_BY_PROJECT, params![id])?;
        tx.execute(constants::DELETE_TASKS_BY_PROJECT, params![id])?;

        let affected = tx.execute(constants::DELETE_PROJECT_BY_ID, params![id])?;
        if affected == 0 {
            return Err(RepositoryError::NotFound {
                entity: "Project",
                id: id.to_string(),
            });
        }

        tx.commit()?;
        Ok(())
    }
}
