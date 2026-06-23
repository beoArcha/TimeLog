use super::constants;
use super::BusinessRepository;
use crate::repositories::shared::errors::Result;
use crate::types::TimeLog;
use rusqlite::params;

impl BusinessRepository {
    pub fn get_time_logs_for_task(&self, task_id: &str) -> Result<Vec<TimeLog>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_TIME_LOGS_BY_TASK)?;
        let rows = stmt.query_map(params![task_id], |row| {
            Ok(TimeLog {
                id: row.get(0)?,
                task_id: row.get(1)?,
                project_id: row.get(2)?,
                start_time: row.get(3)?,
                end_time: row.get(4)?,
                note: None,
                original_start_time: None,
                original_end_time: None,
                original_note: None,
                edit_history: None,
            })
        })?;
        let mut logs = Vec::new();
        for r in rows {
            logs.push(r?);
        }
        Ok(logs)
    }

    pub fn get_project_id_by_task_id(&self, task_id: &str) -> Result<String> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_PROJECT_ID_BY_TASK_ID)?;
        Ok(stmt.query_row(params![task_id], |row| row.get(0))?)
    }

    pub fn close_active_logs_by_project(&self, end_time: &str, project_id: &str) -> Result<usize> {
        let conn = self.connect()?;
        Ok(conn.execute(
            constants::CLOSE_ACTIVE_LOGS_BY_PROJECT,
            params![end_time, project_id],
        )?)
    }

    pub fn close_all_active_logs(&self, end_time: &str) -> Result<usize> {
        let conn = self.connect()?;
        Ok(conn.execute(constants::CLOSE_ALL_ACTIVE_LOGS, params![end_time])?)
    }

    pub fn insert_time_log(&self, log_id: &str, task_id: &str, start_time: &str) -> Result<usize> {
        let conn = self.connect()?;
        Ok(conn.execute(
            constants::INSERT_TIME_LOG,
            params![log_id, task_id, start_time],
        )?)
    }

    pub fn query_active_logs(&self) -> Result<Vec<String>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_ACTIVE_TASK_IDS)?;
        let rows = stmt.query_map([], |row| row.get::<_, String>(0))?;
        let mut ids = Vec::new();
        for id_res in rows {
            ids.push(id_res?);
        }
        Ok(ids)
    }
}
