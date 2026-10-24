use super::constants;
use super::BusinessRepository;
use crate::repositories::shared::errors::{RepositoryError, Result};
use crate::types::TimeLog;
use rusqlite::params;

impl BusinessRepository {
    pub fn map_time_log_row(row: &rusqlite::Row) -> rusqlite::Result<TimeLog> {
        let edit_history_str: Option<String> = row.get(6)?;
        let edit_history: Option<Vec<crate::types::TimeLogEditHistory>> =
            crate::repositories::shared::parse_json_column(6, edit_history_str)?;
        let edit_history = edit_history.filter(|v| !v.is_empty());

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
        stmt.query_row(params![task_id], |row| row.get(0))
            .map_err(|err| match err {
                rusqlite::Error::QueryReturnedNoRows => RepositoryError::NotFound {
                    entity: "Task",
                    id: task_id.to_string(),
                },
                other => RepositoryError::Database(other),
            })
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

    pub fn insert_full_time_log(&self, entry: &crate::types::NewTimeLog) -> Result<usize> {
        let conn = self.connect()?;
        Ok(conn.execute(
            constants::INSERT_FULL_TIME_LOG,
            params![
                entry.id,
                entry.task_id,
                entry.start_time,
                entry.end_time,
                entry.note
            ],
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
        stmt.query_row(params![log_id], Self::map_time_log_row)
            .map_err(|err| match err {
                rusqlite::Error::QueryReturnedNoRows => RepositoryError::NotFound {
                    entity: "TimeLog",
                    id: log_id.to_string(),
                },
                other => RepositoryError::Database(other),
            })
    }

    pub fn update_time_log_with_history(
        &self,
        entry: &crate::types::TimeLogUpdateHistory,
    ) -> Result<()> {
        let mut conn = self.connect()?;
        let tx = conn.transaction()?;

        let affected = tx.execute(
            constants::UPDATE_TIME_LOG,
            params![
                entry.id,
                entry.task_id,
                entry.start_time,
                entry.end_time,
                entry.note
            ],
        )?;
        if affected == 0 {
            return Err(RepositoryError::NotFound {
                entity: "TimeLog",
                id: entry.id.to_string(),
            });
        }

        let reason_str = entry.reason.map(|r| r.as_str());

        tx.execute(
            constants::INSERT_TIME_LOG_HISTORY,
            params![
                entry.history_id,
                entry.id,
                entry.edited_at,
                entry.prev_start_time,
                entry.prev_end_time,
                entry.prev_note,
                reason_str
            ],
        )?;

        tx.commit()?;
        Ok(())
    }

    pub fn delete_time_log(&self, id: &str) -> Result<usize> {
        let conn = self.connect()?;
        let affected = conn.execute(constants::DELETE_TIME_LOG_BY_ID, params![id])?;
        if affected == 0 {
            return Err(RepositoryError::NotFound {
                entity: "TimeLog",
                id: id.to_string(),
            });
        }
        Ok(affected)
    }

    pub fn start_active_log(
        &self,
        end_time: &str,
        log_id: &str,
        task_id: &str,
        start_time: &str,
    ) -> Result<()> {
        let mut conn = self.connect()?;
        let tx = conn.transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;

        let (project_id, allow_concurrency_int): (String, Option<i32>) = {
            let mut stmt = tx.prepare(constants::SELECT_TASK_PROJECT_CONCURRENCY)?;
            stmt.query_row(params![task_id], |row| Ok((row.get(0)?, row.get(1)?)))
                .map_err(|err| match err {
                    rusqlite::Error::QueryReturnedNoRows => RepositoryError::NotFound {
                        entity: "Task",
                        id: task_id.to_string(),
                    },
                    other => RepositoryError::Database(other),
                })?
        };

        tx.execute(
            constants::CLOSE_ACTIVE_LOGS_BY_PROJECT,
            params![end_time, project_id],
        )?;

        let allows_concurrency = allow_concurrency_int.map(|v| v == 1).unwrap_or(false);
        if !allows_concurrency {
            tx.execute(
                constants::CLOSE_ACTIVE_LOGS_NON_CONCURRENT,
                params![end_time],
            )?;
        }

        tx.execute(
            constants::INSERT_TIME_LOG,
            params![log_id, task_id, start_time],
        )?;

        tx.commit()?;
        Ok(())
    }

    pub fn switch_active_logs(
        &self,
        end_time: &str,
        log_id: &str,
        task_id: &str,
        start_time: &str,
    ) -> Result<()> {
        let mut conn = self.connect()?;
        let tx = conn.transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;

        tx.execute(constants::CLOSE_ALL_ACTIVE_LOGS, params![end_time])?;
        tx.execute(
            constants::INSERT_TIME_LOG,
            params![log_id, task_id, start_time],
        )?;

        tx.commit()?;
        Ok(())
    }
}
