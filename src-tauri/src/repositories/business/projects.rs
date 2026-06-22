use super::constants;
use super::BusinessRepository;
use crate::repositories::shared::errors::Result;
use crate::types::{Project, ProjectEditHistory};
use rusqlite::params;

impl BusinessRepository {
    pub fn create_project(&self, project: &Project) -> Result<()> {
        let conn = self.connect()?;
        let edit_history_str = serde_json::to_string(&project.edit_history).ok();
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
                edit_history_str
            ],
        )?;
        Ok(())
    }

    pub fn patch_project(&self, project: &Project) -> Result<()> {
        let conn = self.connect()?;
        let edit_history_str = serde_json::to_string(&project.edit_history).ok();
        conn.execute(
            constants::UPDATE_PROJECT,
            params![
                project.id,
                project.name,
                project.color,
                project.archived.unwrap_or(false) as i32,
                project.original_name,
                project.original_color,
                edit_history_str
            ],
        )?;
        Ok(())
    }

    pub fn archive_project(&self, id: &str) -> Result<()> {
        let conn = self.connect()?;
        conn.execute(constants::ARCHIVE_PROJECT, params![id])?;
        Ok(())
    }

    pub fn get_project(&self, id: &str) -> Result<Option<Project>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_PROJECT_BY_ID)?;
        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            let edit_history_str: Option<String> = row.get(7)?;
            let edit_history: Option<Vec<ProjectEditHistory>> =
                edit_history_str.and_then(|s| serde_json::from_str(&s).ok());
            let archived_int: i32 = row.get(4)?;

            Ok(Some(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
                archived: Some(archived_int == 1),
                original_name: row.get(5)?,
                original_color: row.get(6)?,
                edit_history,
            }))
        } else {
            Ok(None)
        }
    }
}
