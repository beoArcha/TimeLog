import { IWebhookQueuePersistence } from '@common/persistence/IPersistence';
import { WebhookQueueItem } from '@bindings/WebhookQueueItem';
import { WebhookQueueStats } from '@bindings/WebhookQueueStats';
import { STORAGE_KEYS } from '@common/constants/storage-keys';
import { ErrorHandler, PersistenceException } from '@common/exceptions';

export class LocalStorageWebhookQueuePersistence implements IWebhookQueuePersistence {
  private loadQueue(): WebhookQueueItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.WEBHOOK_QUEUE);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data) as Array<
        Omit<WebhookQueueItem, 'retryCount'> & { retryCount: number | string | bigint }
      >;
      return parsed.map((item) => ({
        ...item,
        retryCount: BigInt(item.retryCount ?? 0),
      }));
    } catch (e) {
      ErrorHandler.handle(
        new PersistenceException(
          'Failed to parse webhook queue from LocalStorage',
          e,
          'ERR_PERSISTENCE_PARSE_WEBHOOK_QUEUE'
        )
      );
      return [];
    }
  }

  private saveQueue(queue: WebhookQueueItem[]): void {
    try {
      const serialized = JSON.stringify(queue, (_key, value) =>
        typeof value === 'bigint' ? Number(value) : value
      );
      localStorage.setItem(STORAGE_KEYS.WEBHOOK_QUEUE, serialized);
    } catch (e) {
      ErrorHandler.handle(
        new PersistenceException(
          'Failed to persist webhook queue to LocalStorage',
          e,
          'ERR_PERSISTENCE_SAVE_WEBHOOK_QUEUE'
        )
      );
      throw e;
    }
  }

  async enqueue(item: WebhookQueueItem): Promise<void> {
    const queue = this.loadQueue();
    const existingIndex = queue.findIndex(q => q.id === item.id);
    if (existingIndex >= 0) {
      queue[existingIndex] = item;
    } else {
      queue.push(item);
    }
    this.saveQueue(queue);
  }

  async getPending(): Promise<WebhookQueueItem[]> {
    const queue = this.loadQueue();
    return queue.filter(item => item.status === 'pending');
  }

  async updateStatus(
    id: string,
    status: string,
    retryCount: number | bigint,
    nextRetryAt: string | null,
    lastError: string | null
  ): Promise<void> {
    const queue = this.loadQueue();
    const item = queue.find(q => q.id === id);
    if (item) {
      item.status = status;
      item.retryCount = BigInt(retryCount);
      item.nextRetryAt = nextRetryAt;
      item.lastError = lastError;
      this.saveQueue(queue);
    }
  }

  async delete(id: string): Promise<void> {
    const queue = this.loadQueue();
    const filtered = queue.filter(q => q.id !== id);
    this.saveQueue(filtered);
  }

  async clear(): Promise<void> {
    this.saveQueue([]);
  }

  async getStats(): Promise<WebhookQueueStats> {
    const queue = this.loadQueue();
    return {
      pending: BigInt(queue.filter(q => q.status === 'pending').length),
      failed: BigInt(queue.filter(q => q.status === 'failed').length),
      delivered: BigInt(queue.filter(q => q.status === 'delivered').length),
    };
  }
}
