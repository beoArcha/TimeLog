use crate::common::AppError;
use crate::types::{WebhookQueueItem, WebhookQueueStats};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn enqueue_webhook(item: WebhookQueueItem, state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.webhook_queue.enqueue(&item)?;
    Ok(())
}

#[tauri::command]
pub fn get_pending_webhooks(state: State<'_, AppState>) -> Result<Vec<WebhookQueueItem>, AppError> {
    Ok(state.persistence.webhook_queue.get_pending()?)
}

#[tauri::command]
pub fn update_webhook_status(
    id: String,
    status: String,
    retry_count: i64,
    next_retry_at: Option<String>,
    last_error: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.persistence.webhook_queue.update_status(
        &id,
        &status,
        retry_count,
        next_retry_at.as_deref(),
        last_error.as_deref(),
    )?;
    Ok(())
}

#[tauri::command]
pub fn delete_webhook(id: String, state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.webhook_queue.delete(&id)?;
    Ok(())
}

#[tauri::command]
pub fn clear_webhook_queue(state: State<'_, AppState>) -> Result<(), AppError> {
    state.persistence.webhook_queue.clear()?;
    Ok(())
}

#[tauri::command]
pub fn get_webhook_queue_stats(state: State<'_, AppState>) -> Result<WebhookQueueStats, AppError> {
    Ok(state.persistence.webhook_queue.get_stats()?)
}
