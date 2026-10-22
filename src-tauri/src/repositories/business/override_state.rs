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

        Self::clear_existing_records(&tx, projects.is_some(), tasks.is_some(), logs.is_some())?;

        if let Some(ref projs) = projects {
            Self::insert_projects(&tx, projs)?;
        }

        if let Some(ref tlist) = tasks {
            Self::insert_tasks(&tx, tlist)?;
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
        // Cascade dependencies: logs & history first, then tasks, then projects
        if has_logs || has_tasks || has_projects {
            tx.execute(constants::DELETE_ALL_TIME_LOGS, [])?;
            tx.execute("DELETE FROM time_logs_history", [])?;
        }

        if has_tasks || has_projects {
            tx.execute(constants::DELETE_ALL_TASKS, [])?;
        }

        if has_projects {
            tx.execute(constants::DELETE_ALL_PROJECTS, [])?;
        }

        Ok(())
    }

    fn insert_projects(tx: &Transaction, projects: &[Project]) -> Result<()> {
        for p in projects {
            let edit_history_str = serde_json::to_string(&p.edit_history).ok();
            let tags_str = serde_json::to_string(&p.tags).ok();
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
                ],
            )?;
        }
        Ok(())
    }

    fn insert_tasks(tx: &Transaction, tasks: &[Task]) -> Result<()> {
        // Insert root tasks before subtasks to satisfy foreign key constraints
        let (roots, children): (Vec<&Task>, Vec<&Task>) =
            tasks.iter().partition(|t| t.parent_task_id.is_none());

        for t in roots.into_iter().chain(children) {
            let edit_history_str = serde_json::to_string(&t.edit_history).ok();
            let status_str = Self::task_status_to_str(t.status.as_ref());

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
