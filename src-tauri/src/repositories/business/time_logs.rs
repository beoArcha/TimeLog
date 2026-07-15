use super::constants;
use super::BusinessRepository;
use crate::repositories::shared::errors::Result;
use crate::types::TimeLog;
use rusqlite::params;

impl BusinessRepository {
    fn map_time_log_row(row: &rusqlite::Row) -> rusqlite::Result<TimeLog> {
        let edit_history_str: Option<String> = row.get(6)?;
        let edit_history = edit_history_str
            .and_then(|s| serde_json::from_str::<Vec<crate::types::TimeLogEditHistory>>(&s).ok())
            .filter(|v| !v.is_empty());

        Ok(TimeLog {
            id: row.get(0)?,
            task_id: row.get(1)?,
            project_id: row.get(2)?,
            start_time: row.get(3)?,
            end_time: row.get(4)?,
            note: row.get(5)?,
            edit_history,
        })
    }

    pub fn get_time_logs_for_task(&self, task_id: &str) -> Result<Vec<TimeLog>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_TIME_LOGS_BY_TASK)?;
        let rows = stmt.query_map(params![task_id], Self::map_time_log_row)?;
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

    pub fn get_all_time_logs(&self) -> Result<Vec<TimeLog>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_ALL_TIME_LOGS)?;
        let rows = stmt.query_map([], Self::map_time_log_row)?;
        let mut logs = Vec::new();
        for r in rows {
            logs.push(r?);
        }
        Ok(logs)
    }

    pub fn get_time_log_by_id(&self, log_id: &str) -> Result<TimeLog> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_TIME_LOG_BY_ID)?;
        Ok(stmt.query_row(params![log_id], Self::map_time_log_row)?)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn update_time_log_with_history(
        &self,
        id: &str,
        task_id: &str,
        start_time: &str,
        end_time: Option<&str>,
        note: Option<&str>,
        history_id: &str,
        edited_at: &str,
        prev_start_time: Option<&str>,
        prev_end_time: Option<&str>,
        prev_note: Option<&str>,
        reason: Option<&str>,
    ) -> Result<()> {
        let mut conn = self.connect()?;
        let tx = conn.transaction()?;

        tx.execute(
            constants::UPDATE_TIME_LOG,
            params![id, task_id, start_time, end_time, note],
        )?;

        tx.execute(
            constants::INSERT_TIME_LOG_HISTORY,
            params![
                history_id,
                id,
                edited_at,
                prev_start_time,
                prev_end_time,
                prev_note,
                reason
            ],
        )?;

        tx.commit()?;
        Ok(())
    }
}
