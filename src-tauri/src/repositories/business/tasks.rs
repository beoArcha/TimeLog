use super::constants;
use super::BusinessRepository;
use crate::repositories::shared::errors::RepositoryError;
use crate::repositories::shared::errors::Result;
use crate::types::{Task, TaskEditHistory};
use rusqlite::params;

impl BusinessRepository {
    pub fn create_task(&self, task: &Task) -> Result<()> {
        let conn = self.connect()?;
        let edit_history_str = task
            .edit_history
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;
        let status_str = match &task.status {
            Some(s) => serde_json::to_string(s)?.trim_matches('"').to_string(),
            None => "Todo".to_string(),
        };

        let effective_cents: Option<i64> = task.billing_rate_cents.or_else(|| {
            task
                .hourly_rate
                .as_deref()
                .and_then(crate::engine::billing::parse_rate_to_cents)
                .map(|c| c as i64)
        });
        let effective_hourly_rate: Option<String> = task.hourly_rate.clone().or_else(|| {
            effective_cents.map(|c| crate::engine::billing::format_cents(c as u64))
        });
        let effective_currency: Option<String> = task
            .currency
            .clone()
            .or_else(|| task.billing_currency.clone());
        let effective_billing_currency: Option<String> = task
            .billing_currency
            .clone()
            .or_else(|| task.currency.clone());

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
                status_str,
                effective_hourly_rate,
                effective_cents,
                effective_billing_currency,
                effective_currency
            ],
        )?;
        Ok(())
    }

    pub fn patch_task(&self, task: &Task) -> Result<()> {
        let conn = self.connect()?;
        let edit_history_str = task
            .edit_history
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;
        let status_str = match &task.status {
            Some(s) => serde_json::to_string(s)?.trim_matches('"').to_string(),
            None => "Todo".to_string(),
        };

        let effective_cents: Option<i64> = task.billing_rate_cents.or_else(|| {
            task
                .hourly_rate
                .as_deref()
                .and_then(crate::engine::billing::parse_rate_to_cents)
                .map(|c| c as i64)
        });
        let effective_hourly_rate: Option<String> = task.hourly_rate.clone().or_else(|| {
            effective_cents.map(|c| crate::engine::billing::format_cents(c as u64))
        });
        let effective_currency: Option<String> = task
            .currency
            .clone()
            .or_else(|| task.billing_currency.clone());
        let effective_billing_currency: Option<String> = task
            .billing_currency
            .clone()
            .or_else(|| task.currency.clone());

        let affected = conn.execute(
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
                status_str,
                effective_hourly_rate,
                effective_cents,
                effective_billing_currency,
                effective_currency
            ],
        )?;
        if affected == 0 {
            return Err(RepositoryError::NotFound {
                entity: "Task",
                id: task.id.clone(),
            });
        }
        Ok(())
    }

    pub fn archive_task(&self, id: &str) -> Result<()> {
        let conn = self.connect()?;
        let affected = conn.execute(constants::ARCHIVE_TASK, params![id])?;
        if affected == 0 {
            return Err(RepositoryError::NotFound {
                entity: "Task",
                id: id.to_string(),
            });
        }
        Ok(())
    }

    fn map_task_row(row: &rusqlite::Row) -> rusqlite::Result<Task> {
        let edit_history_str: Option<String> = row.get(8)?;
        let edit_history: Option<Vec<TaskEditHistory>> =
            crate::repositories::shared::parse_json_column(8, edit_history_str)?;
        let completed_int: i32 = row.get(4)?;
        let orig_comp_int: Option<i32> = row.get(7)?;
        let archived_int: i32 = row.get(9)?;
        let status_str: Option<String> = row.get(10)?;
        let status: Option<crate::types::TaskStatus> = match status_str {
            None => None,
            Some(s) if s.trim().is_empty() || s.trim() == "null" => None,
            Some(s) => {
                let quoted = if s.starts_with('"') {
                    s
                } else {
                    format!("\"{}\"", s)
                };
                match serde_json::from_str::<crate::types::TaskStatus>(&quoted) {
                    Ok(st) => Some(st),
                    Err(err) => {
                        return Err(rusqlite::Error::FromSqlConversionFailure(
                            10,
                            rusqlite::types::Type::Text,
                            Box::new(err),
                        ));
                    }
                }
            }
        };

        let mut hourly_rate: Option<String> = row.get(11)?;
        let billing_rate_cents: Option<i64> = row.get(12).ok().flatten();
        let billing_currency: Option<String> = row.get(13).ok().flatten();
        let mut currency: Option<String> = row.get(14).ok().flatten();

        if hourly_rate.is_none() {
            if let Some(cents) = billing_rate_cents {
                hourly_rate = Some(crate::engine::billing::format_cents(cents as u64));
            }
        }
        if currency.is_none() {
            currency = billing_currency.clone();
        }

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
            hourly_rate,
            currency,
            billing_rate_cents,
            billing_currency,
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
