import { invoke } from '@tauri-apps/api/core';
import { IWebhookQueuePersistence } from '../IPersistence';
import { WebhookQueueItem } from '@bindings/WebhookQueueItem';
import { WebhookQueueStats } from '@bindings/WebhookQueueStats';
import { ErrorHandler, TauriInteropException } from '../../exceptions';

export class TauriWebhookQueuePersistence implements IWebhookQueuePersistence {
  async enqueue(item: WebhookQueueItem): Promise<void> {
    try {
      await invoke('enqueue_webhook', { item });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to enqueue webhook via Tauri', err, 'ERR_TAURI_WEBHOOK_ENQUEUE'));
      throw err;
    }
  }

  async getPending(): Promise<WebhookQueueItem[]> {
    try {
      return await invoke<WebhookQueueItem[]>('get_pending_webhooks');
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get pending webhooks via Tauri', err, 'ERR_TAURI_WEBHOOK_GET_PENDING'));
      throw err;
    }
  }

  async updateStatus(
    id: string,
    status: string,
    retryCount: number | bigint,
    nextRetryAt: string | null,
    lastError: string | null
  ): Promise<void> {
    try {
      await invoke('update_webhook_status', {
        id,
        status,
        retryCount: Number(retryCount),
        nextRetryAt,
        lastError,
      });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to update webhook status via Tauri', err, 'ERR_TAURI_WEBHOOK_UPDATE_STATUS'));
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await invoke('delete_webhook', { id });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to delete webhook via Tauri', err, 'ERR_TAURI_WEBHOOK_DELETE'));
      throw err;
    }
  }

  async clear(): Promise<void> {
    try {
      await invoke('clear_webhook_queue');
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to clear webhook queue via Tauri', err, 'ERR_TAURI_WEBHOOK_CLEAR'));
      throw err;
    }
  }

  async getStats(): Promise<WebhookQueueStats> {
    try {
      return await invoke<WebhookQueueStats>('get_webhook_queue_stats');
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get webhook stats via Tauri', err, 'ERR_TAURI_WEBHOOK_GET_STATS'));
      throw err;
    }
  }
}
