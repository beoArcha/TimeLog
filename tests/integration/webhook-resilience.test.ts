import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebhookDispatcher } from '@common/sinks/WebhookDispatcher';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { STORAGE_KEYS } from '@common/constants';
import { setupLocalStorageMock } from '@tests/shared/test-helpers';

describe('Integration Tests: WebhookResilience and Queue Dispatcher', () => {
  const TEST_API_URL = 'https://api.timelog.example.com/hooks';

  beforeEach(async () => {
    setupLocalStorageMock();
    WebhookDispatcher.resetForTesting();

    // Enable external API sync in localStorage so LocalStorageExternalApiPersistence reads it
    localStorage.setItem(STORAGE_KEYS.LOG_TO_API, 'true');
    localStorage.setItem(STORAGE_KEYS.API_URL, TEST_API_URL);
    localStorage.setItem(STORAGE_KEYS.API_METHOD, 'POST');
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, 'secret-test-token');
    localStorage.setItem(STORAGE_KEYS.API_HEADERS, JSON.stringify({ 'X-Custom-Source': 'TimeLog' }));

    // Reset the webhook queue in persistence
    await PersistenceRouter.getInstance().webhookQueue.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should queue payload and record error state when network delivery fails', async () => {
    // Arrange: Mock network failure
    global.fetch = vi.fn().mockRejectedValue(new Error('Network unreachable (ENOTFOUND)'));
    const dispatcher = WebhookDispatcher.getInstance();
    const payload = { task: 'Develop Phase 8', durationSec: 1800 };

    // Act: Enqueue outgoing webhook
    await dispatcher.enqueue(payload, 'timelog.logged');

    // Assert: Verify payload was stored in persistent queue with retry metadata
    const pendingItems = await PersistenceRouter.getInstance().webhookQueue.getPending();
    expect(pendingItems).toHaveLength(1);
    expect(pendingItems[0].url).toBe(TEST_API_URL);
    expect(pendingItems[0].status).toBe('pending');
    expect(Number(pendingItems[0].retryCount)).toBe(1);
    expect(pendingItems[0].lastError).toContain('Network unreachable');

    // Verify dispatcher reflects queued status
    const status = dispatcher.getStatus();
    expect(status.state).toBe('queued');
    expect(status.pendingCount).toBe(1);
    expect(status.failedCount).toBe(0);
  });

  it('should deliver pending items and clear queue when network recovers and retryNow is called', async () => {
    // Arrange: Start with offline failure
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Connection timed out'));
    const dispatcher = WebhookDispatcher.getInstance();
    await dispatcher.enqueue({ event: 'entry_1' }, 'timelog.logged');

    expect((await PersistenceRouter.getInstance().webhookQueue.getPending()).length).toBe(1);

    // Arrange recovery: Fetch now resolves successfully
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as unknown as Response);

    // Act: Trigger explicit redelivery
    await dispatcher.retryNow();

    // Assert: Item delivered and purged from persistent queue
    const pendingItems = await PersistenceRouter.getInstance().webhookQueue.getPending();
    expect(pendingItems).toHaveLength(0);

    const status = dispatcher.getStatus();
    expect(status.state).toBe('idle');
    expect(status.pendingCount).toBe(0);
    expect(status.lastDeliveredAt).not.toBeNull();
  });

  it('should transition item to failed and set error status when retries are exhausted', async () => {
    // Arrange: Enqueue item with 4 previous retries
    const router = PersistenceRouter.getInstance();
    const exhaustedItem = {
      id: 'exhaust-test-item',
      url: TEST_API_URL,
      method: 'POST',
      headers: null,
      payload: JSON.stringify({ test: 'exhaust' }),
      status: 'pending',
      retryCount: 4n,
      nextRetryAt: null,
      lastError: 'Earlier failure',
      createdAt: new Date().toISOString(),
    };
    await router.webhookQueue.enqueue(exhaustedItem);

    // Mock network failure on the 5th attempt
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as unknown as Response);

    const dispatcher = WebhookDispatcher.getInstance();

    // Act: Flush the queue
    await dispatcher.flush();

    // Assert: Item status transitioned to 'failed' (no longer pending)
    const pendingItems = await router.webhookQueue.getPending();
    expect(pendingItems).toHaveLength(0);

    const stats = await router.webhookQueue.getStats();
    expect(Number(stats.failed)).toBe(1);

    const status = dispatcher.getStatus();
    expect(status.state).toBe('error');
    expect(status.failedCount).toBe(1);
  });
});
