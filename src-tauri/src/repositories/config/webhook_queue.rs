use super::constants::{
    CLEAR_WEBHOOK_QUEUE, DELETE_WEBHOOK_BY_ID, INSERT_OR_REPLACE_WEBHOOK_QUEUE_ITEM,
    SELECT_PENDING_WEBHOOKS, SELECT_WEBHOOK_QUEUE_STATS, UPDATE_WEBHOOK_STATUS,
};
use super::ConfigRepository;
use crate::repositories::shared::errors::Result;
use crate::types::{WebhookQueueItem, WebhookQueueStats};
use rusqlite::params;

impl ConfigRepository {
    pub fn enqueue_webhook(&self, item: &WebhookQueueItem) -> Result<()> {
        let conn = self.connect()?;
        conn.execute(
            INSERT_OR_REPLACE_WEBHOOK_QUEUE_ITEM,
            params![
                item.id,
                item.url,
                item.method,
                item.headers,
                item.payload,
                item.status,
                item.retry_count,
                item.next_retry_at,
                item.last_error,
                item.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_pending_webhooks(&self) -> Result<Vec<WebhookQueueItem>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(SELECT_PENDING_WEBHOOKS)?;

        let rows = stmt.query_map([], |row| {
            Ok(WebhookQueueItem {
                id: row.get(0)?,
                url: row.get(1)?,
                method: row.get(2)?,
                headers: row.get(3)?,
                payload: row.get(4)?,
                status: row.get(5)?,
                retry_count: row.get(6)?,
                next_retry_at: row.get(7)?,
                last_error: row.get(8)?,
                created_at: row.get(9)?,
            })
        })?;

        let mut items = Vec::new();
        for item in rows {
            items.push(item?);
        }
        Ok(items)
    }

    pub fn update_webhook_status(
        &self,
        id: &str,
        status: &str,
        retry_count: i64,
        next_retry_at: Option<&str>,
        last_error: Option<&str>,
    ) -> Result<()> {
        let conn = self.connect()?;
        conn.execute(
            UPDATE_WEBHOOK_STATUS,
            params![id, status, retry_count, next_retry_at, last_error],
        )?;
        Ok(())
    }

    pub fn delete_webhook(&self, id: &str) -> Result<()> {
        let conn = self.connect()?;
        conn.execute(DELETE_WEBHOOK_BY_ID, params![id])?;
        Ok(())
    }

    pub fn clear_webhook_queue(&self) -> Result<()> {
        let conn = self.connect()?;
        conn.execute(CLEAR_WEBHOOK_QUEUE, [])?;
        Ok(())
    }

    pub fn get_webhook_queue_stats(&self) -> Result<WebhookQueueStats> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(SELECT_WEBHOOK_QUEUE_STATS)?;

        let mut rows = stmt.query([])?;
        if let Some(row) = rows.next()? {
            Ok(WebhookQueueStats {
                pending: row.get(0)?,
                failed: row.get(1)?,
                delivered: row.get(2)?,
            })
        } else {
            Ok(WebhookQueueStats::default())
        }
    }
}
