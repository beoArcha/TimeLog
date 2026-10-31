use super::constants;
use super::BusinessRepository;
use crate::repositories::shared::errors::Result;
use crate::types::{Project, Task, TaskStatus, TimeLog};
use rusqlite::{params, Transaction};

impl BusinessRepository {
    pub fn override_state(
        &self,
        projects: Option<Vec<Project>>,
        tasks: Option<Vec<Task>>,
        logs: Option<Vec<TimeLog>>,
    ) -> Result<()> {
        let mut conn = self.connect()?;
        let tx = conn.transaction()?;

        let replace_all_projects = projects.is_some() && tasks.is_some();
        let replace_all_tasks = tasks.is_some() && logs.is_some();

        Self::clear_existing_records(&tx, replace_all_projects, replace_all_tasks, logs.is_some())?;

        if let Some(ref projs) = projects {
            if replace_all_projects {
                Self::insert_projects(&tx, projs)?;
            } else {
                Self::sync_projects_selectively(&tx, projs)?;
            }
        }

        if let Some(ref tlist) = tasks {
            if replace_all_tasks {
                Self::insert_tasks(&tx, tlist)?;
            } else {
                Self::sync_tasks_selectively(&tx, tlist)?;
            }
        }

        if let Some(ref llist) = logs {
            Self::insert_time_logs(&tx, llist)?;
        }

        tx.commit()?;
        Ok(())
    }

    fn clear_existing_records(
        tx: &Transaction,
        has_projects: bool,
        has_tasks: bool,
        has_logs: bool,
    ) -> Result<()> {
        if has_logs {
            tx.execute(constants::DELETE_ALL_TIME_LOGS, [])?;
            tx.execute("DELETE FROM time_logs_history", [])?;
        }

        if has_tasks {
            tx.execute(constants::DELETE_ALL_TASKS, [])?;
        }

        if has_projects {
            tx.execute(constants::DELETE_ALL_PROJECTS, [])?;
        }

        Ok(())
    }

    fn sync_projects_selectively(tx: &Transaction, projects: &[Project]) -> Result<()> {
        let new_ids: std::collections::HashSet<&str> =
            projects.iter().map(|p| p.id.as_str()).collect();

        let mut stmt = tx.prepare(constants::SELECT_ALL_PROJECT_IDS)?;
        let existing_ids: Vec<String> = stmt
            .query_map([], |row| row.get(0))?
            .collect::<rusqlite::Result<Vec<String>>>()?;

        for id in existing_ids {
            if !new_ids.contains(id.as_str()) {
                tx.execute(constants::DELETE_PROJECT_BY_ID, params![id])?;
            }
        }

        for p in projects {
            let edit_history_str = p
                .edit_history
                .as_ref()
                .map(serde_json::to_string)
                .transpose()?;
            let tags_str = p.tags.as_ref().map(serde_json::to_string).transpose()?;
            let effective_cents: Option<i64> = p.billing_rate_cents.or_else(|| {
                p.hourly_rate
                    .as_deref()
                    .and_then(crate::engine::billing::parse_rate_to_cents)
                    .map(|c| c as i64)
            });
            let effective_currency = p.currency.clone().or_else(|| p.billing_currency.clone());
            let effective_hourly_rate: Option<String> = p.hourly_rate.clone().or_else(|| {
                effective_cents.map(|c| crate::engine::billing::format_cents(c as u64))
            });
            tx.execute(
                constants::UPSERT_PROJECT,
                params![
                    p.id,
                    p.name,
                    p.color,
                    p.created_at,
                    p.archived.unwrap_or(false) as i32,
                    p.original_name,
                    p.original_color,
                    edit_history_str,
                    p.description,
                    p.icon,
                    tags_str,
                    p.allow_concurrency.unwrap_or(false) as i32,
                    effective_hourly_rate,
                    effective_currency.clone(),
                    effective_cents,
                    effective_currency,
                ],
            )?;
        }

        Ok(())
    }

    fn sync_tasks_selectively(tx: &Transaction, tasks: &[Task]) -> Result<()> {
        let new_ids: std::collections::HashSet<&str> =
            tasks.iter().map(|t| t.id.as_str()).collect();

        let mut stmt = tx.prepare(constants::SELECT_ALL_TASK_IDS)?;
        let existing_ids: Vec<String> = stmt
            .query_map([], |row| row.get(0))?
            .collect::<rusqlite::Result<Vec<String>>>()?;

        for id in existing_ids {
            if !new_ids.contains(id.as_str()) {
                tx.execute(constants::DELETE_TASK_BY_ID, params![id])?;
            }
        }

        // Insert root tasks before subtasks to satisfy foreign key hierarchy constraints.
        let (roots, children): (Vec<&Task>, Vec<&Task>) =
            tasks.iter().partition(|t| t.parent_task_id.is_none());

        for t in roots.into_iter().chain(children) {
            let edit_history_str = t
                .edit_history
                .as_ref()
                .map(serde_json::to_string)
                .transpose()?;
            let status_str = Self::task_status_to_str(t.status.as_ref());
            let effective_cents: Option<i64> = t.billing_rate_cents.or_else(|| {
                t.hourly_rate
                    .as_deref()
                    .and_then(crate::engine::billing::parse_rate_to_cents)
                    .map(|c| c as i64)
            });
            let effective_currency = t.currency.clone().or_else(|| t.billing_currency.clone());
            let effective_hourly_rate: Option<String> = t.hourly_rate.clone().or_else(|| {
                effective_cents.map(|c| crate::engine::billing::format_cents(c as u64))
            });

            tx.execute(
                constants::UPSERT_TASK,
                params![
                    t.id,
                    t.project_id,
                    t.parent_task_id,
                    t.name,
                    t.completed as i32,
                    t.created_at,
                    t.original_name,
                    t.original_completed.unwrap_or(false) as i32,
                    edit_history_str,
                    t.archived.unwrap_or(false) as i32,
                    status_str,
                    effective_hourly_rate,
                    effective_cents,
                    effective_currency.clone(),
                    effective_currency,
                ],
            )?;
        }

        Ok(())
    }

    fn insert_projects(tx: &Transaction, projects: &[Project]) -> Result<()> {
        for p in projects {
            let edit_history_str = p
                .edit_history
                .as_ref()
                .map(serde_json::to_string)
                .transpose()?;
            let tags_str = p.tags.as_ref().map(serde_json::to_string).transpose()?;
            let effective_cents: Option<i64> = p.billing_rate_cents.or_else(|| {
                p.hourly_rate
                    .as_deref()
                    .and_then(crate::engine::billing::parse_rate_to_cents)
                    .map(|c| c as i64)
            });
            let effective_currency = p.currency.clone().or_else(|| p.billing_currency.clone());
            let effective_hourly_rate: Option<String> = p.hourly_rate.clone().or_else(|| {
                effective_cents.map(|c| crate::engine::billing::format_cents(c as u64))
            });
            tx.execute(
                constants::INSERT_PROJECT,
                params![
                    p.id,
                    p.name,
                    p.color,
                    p.created_at,
                    p.archived.unwrap_or(false) as i32,
                    p.original_name,
                    p.original_color,
                    edit_history_str,
                    p.description,
                    p.icon,
                    tags_str,
                    p.allow_concurrency.unwrap_or(false) as i32,
                    effective_hourly_rate,
                    effective_currency.clone(),
                    effective_cents,
                    effective_currency,
                ],
            )?;
        }
        Ok(())
    }

    fn insert_tasks(tx: &Transaction, tasks: &[Task]) -> Result<()> {
        // Insert root tasks before subtasks to satisfy foreign key hierarchy constraints.
        let (roots, children): (Vec<&Task>, Vec<&Task>) =
            tasks.iter().partition(|t| t.parent_task_id.is_none());

        for t in roots.into_iter().chain(children) {
            let edit_history_str = t
                .edit_history
                .as_ref()
                .map(serde_json::to_string)
                .transpose()?;
            let status_str = Self::task_status_to_str(t.status.as_ref());
            let effective_cents: Option<i64> = t.billing_rate_cents.or_else(|| {
                t.hourly_rate
                    .as_deref()
                    .and_then(crate::engine::billing::parse_rate_to_cents)
                    .map(|c| c as i64)
            });
            let effective_currency = t.currency.clone().or_else(|| t.billing_currency.clone());
            let effective_hourly_rate: Option<String> = t.hourly_rate.clone().or_else(|| {
                effective_cents.map(|c| crate::engine::billing::format_cents(c as u64))
            });

            tx.execute(
                constants::INSERT_TASK,
                params![
                    t.id,
                    t.project_id,
                    t.parent_task_id,
                    t.name,
                    t.completed as i32,
                    t.created_at,
                    t.original_name,
                    t.original_completed.unwrap_or(false) as i32,
                    edit_history_str,
                    t.archived.unwrap_or(false) as i32,
                    status_str,
                    effective_hourly_rate,
                    effective_cents,
                    effective_currency.clone(),
                    effective_currency,
                ],
            )?;
        }
        Ok(())
    }

    fn task_status_to_str(status: Option<&TaskStatus>) -> &'static str {
        match status {
            Some(TaskStatus::Todo) => "Todo",
            Some(TaskStatus::InProgress) => "InProgress",
            Some(TaskStatus::Done) => "Done",
            Some(TaskStatus::Blocked) => "Blocked",
            None => "Todo",
        }
    }

    fn insert_time_logs(tx: &Transaction, logs: &[TimeLog]) -> Result<()> {
        for l in logs {
            tx.execute(
                constants::INSERT_FULL_TIME_LOG,
                params![l.id, l.task_id, l.start_time, l.end_time, l.note],
            )?;

            if let Some(ref history) = l.edit_history {
                for (idx, h) in history.iter().enumerate() {
                    let h_id = format!("hist_{}_{}", l.id, idx);
                    tx.execute(
                        constants::INSERT_TIME_LOG_HISTORY,
                        params![
                            h_id,
                            l.id,
                            h.edited_at,
                            h.prev_start_time,
                            h.prev_end_time,
                            h.prev_note,
                            h.reason,
                        ],
                    )?;
                }
            }
        }
        Ok(())
    }
}
