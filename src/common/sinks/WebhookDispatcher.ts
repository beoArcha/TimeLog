import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { PluginRegistry } from '@plugins/PluginRegistry';
import { WebhookQueueItem } from '@bindings/WebhookQueueItem';

export interface WebhookSyncStatus {
  state: 'idle' | 'syncing' | 'queued' | 'error';
  pendingCount: number;
  failedCount: number;
  lastError: string | null;
  lastDeliveredAt: string | null;
}

export type WebhookStatusListener = (status: WebhookSyncStatus) => void;

const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000];
const MAX_RETRIES = 5;

/**
 * Resilient WebhookDispatcher managing guaranteed at-least-once delivery
 * with persistent SQLite/LocalStorage queuing and exponential backoff.
 */
export class WebhookDispatcher {
  private static instance: WebhookDispatcher | null = null;
  private isProcessing = false;
  private listeners: Set<WebhookStatusListener> = new Set();
  private currentStatus: WebhookSyncStatus = {
    state: 'idle',
    pendingCount: 0,
    failedCount: 0,
    lastError: null,
    lastDeliveredAt: null,
  };

  private constructor() {}

  public static getInstance(): WebhookDispatcher {
    if (!WebhookDispatcher.instance) {
      WebhookDispatcher.instance = new WebhookDispatcher();
    }
    return WebhookDispatcher.instance;
  }

  public static resetForTesting(): void {
    WebhookDispatcher.instance = null;
  }

  public subscribe(listener: WebhookStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): WebhookSyncStatus {
    return { ...this.currentStatus };
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {
        console.error('[WebhookDispatcher] Error in status listener:', err);
      }
    });
  }

  /**
   * Enqueues an outgoing webhook payload for reliable delivery.
   */
  public async enqueue(payload: unknown, eventName = 'timelog.logged'): Promise<void> {
    const router = PersistenceRouter.getInstance();
    const settings = await router.externalApi.getSettings();

    if (!settings.logToApi || !settings.apiUrl) {
      // If external API sync is disabled, broadcast locally to in-process plugin hooks
      await PluginRegistry.getInstance().emitEvent(eventName, payload);
      return;
    }

    const item: WebhookQueueItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hook_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url: settings.apiUrl,
      method: settings.apiMethod || 'POST',
      headers: settings.apiHeaders || null,
      payload: JSON.stringify(payload),
      status: 'pending',
      retryCount: 0n,
      nextRetryAt: null,
      lastError: null,
      createdAt: new Date().toISOString(),
    };

    await router.webhookQueue.enqueue(item);
    await this.refreshStats();
    await this.flush();
  }

  /**
   * Flushes pending items in the queue with exponential backoff protection.
   */
  public async flush(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const router = PersistenceRouter.getInstance();
      const settings = await router.externalApi.getSettings();
      const pendingItems = await router.webhookQueue.getPending();

      if (pendingItems.length === 0) {
        await this.refreshStats();
        return;
      }

      this.currentStatus.state = 'syncing';
      this.notifyListeners();

      const now = Date.now();

      for (const item of pendingItems) {
        if (item.nextRetryAt && new Date(item.nextRetryAt).getTime() > now) {
          continue;
        }

        let headersObj: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (settings.apiToken) {
          headersObj['Authorization'] = `Bearer ${settings.apiToken}`;
        }

        if (item.headers) {
          try {
            headersObj = { ...headersObj, ...JSON.parse(item.headers) };
          } catch {
            // Invalid custom headers are ignored to maintain dispatch attempts
          }
        }

        try {
          const response = await fetch(item.url, {
            method: item.method || 'POST',
            headers: headersObj,
            body: item.payload,
          });

          if (response.ok) {
            await router.webhookQueue.delete(item.id);
            this.currentStatus.lastDeliveredAt = new Date().toISOString();
            this.currentStatus.lastError = null;
          } else {
            const errorText = `HTTP ${response.status} ${response.statusText}`;
            await this.handleItemFailure(item, errorText);
          }
        } catch (fetchError) {
          const errorMsg = fetchError instanceof Error ? fetchError.message : 'Network error';
          await this.handleItemFailure(item, errorMsg);
        }
      }
    } finally {
      this.isProcessing = false;
      await this.refreshStats();
    }
  }

  private async handleItemFailure(item: WebhookQueueItem, errorMsg: string): Promise<void> {
    const router = PersistenceRouter.getInstance();
    const retries = Number(item.retryCount) + 1;
    const isExhausted = retries >= MAX_RETRIES;
    const delay = BACKOFF_DELAYS[Math.min(retries - 1, BACKOFF_DELAYS.length - 1)];
    const nextRetry = isExhausted ? null : new Date(Date.now() + delay).toISOString();
    const newStatus = isExhausted ? 'failed' : 'pending';

    await router.webhookQueue.updateStatus(item.id, newStatus, retries, nextRetry, errorMsg);
    this.currentStatus.lastError = errorMsg;
  }

  /**
   * Resets retry timers to now and immediately attempts redelivery of all queued items.
   */
  public async retryNow(): Promise<void> {
    const router = PersistenceRouter.getInstance();
    const pendingItems = await router.webhookQueue.getPending();
    for (const item of pendingItems) {
      await router.webhookQueue.updateStatus(item.id, 'pending', 0, null, null);
    }
    await this.flush();
  }

  public async refreshStats(): Promise<void> {
    const router = PersistenceRouter.getInstance();
    const stats = await router.webhookQueue.getStats();
    this.currentStatus.pendingCount = Number(stats.pending);
    this.currentStatus.failedCount = Number(stats.failed);

    if (this.currentStatus.failedCount > 0) {
      this.currentStatus.state = 'error';
    } else if (this.currentStatus.pendingCount > 0) {
      this.currentStatus.state = 'queued';
    } else {
      this.currentStatus.state = 'idle';
    }

    this.notifyListeners();
  }
}
