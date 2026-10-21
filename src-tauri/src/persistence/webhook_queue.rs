use super::error::PersistenceResult;
use super::shared::PersistenceShared;
use crate::types::{WebhookQueueItem, WebhookQueueStats};
use std::sync::Arc;

pub struct WebhookQueuePersistence {
    shared: Arc<PersistenceShared>,
}

impl WebhookQueuePersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn enqueue(&self, item: &WebhookQueueItem) -> PersistenceResult<()> {
        self.shared.config_repo.enqueue_webhook(item)?;
        Ok(())
    }

    pub fn get_pending(&self) -> PersistenceResult<Vec<WebhookQueueItem>> {
        Ok(self.shared.config_repo.get_pending_webhooks()?)
    }

    pub fn update_status(
        &self,
        id: &str,
        status: &str,
        retry_count: i64,
        next_retry_at: Option<&str>,
        last_error: Option<&str>,
    ) -> PersistenceResult<()> {
        self.shared.config_repo.update_webhook_status(
            id,
            status,
            retry_count,
            next_retry_at,
            last_error,
        )?;
        Ok(())
    }

    pub fn delete(&self, id: &str) -> PersistenceResult<()> {
        self.shared.config_repo.delete_webhook(id)?;
        Ok(())
    }

    pub fn clear(&self) -> PersistenceResult<()> {
        self.shared.config_repo.clear_webhook_queue()?;
        Ok(())
    }

    pub fn get_stats(&self) -> PersistenceResult<WebhookQueueStats> {
        Ok(self.shared.config_repo.get_webhook_queue_stats()?)
    }
}
