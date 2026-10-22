import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebhookDispatcher } from '@common/sinks/WebhookDispatcher';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { STORAGE_KEYS } from '@common/constants';
import { setupLocalStorageMock } from '@tests/shared/test-helpers';

describe('Given WebhookDispatcher and persistent outgoing queue', () => {
  const TEST_API_URL = 'https://api.timelog.example.com/hooks';

  beforeEach(async () => {
    setupLocalStorageMock();
    WebhookDispatcher.resetForTesting();

    localStorage.setItem(STORAGE_KEYS.LOG_TO_API, 'true');
    localStorage.setItem(STORAGE_KEYS.API_URL, TEST_API_URL);
    localStorage.setItem(STORAGE_KEYS.API_METHOD, 'POST');
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, 'secret-test-token');
    localStorage.setItem(STORAGE_KEYS.API_HEADERS, JSON.stringify({ 'X-Custom-Source': 'TimeLog' }));

    await PersistenceRouter.getInstance().webhookQueue.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('When outgoing network request fails with connection error', () => {
    it('Then it should queue the payload in persistence and update status to queued', async () => {
      // Given
      global.fetch = vi.fn().mockRejectedValue(new Error('Network unreachable (ENOTFOUND)'));
      const dispatcher = WebhookDispatcher.getInstance();
      const payload = { task: 'Develop Phase 8', durationSec: 1800 };

      // When
      await dispatcher.enqueue(payload, 'timelog.logged');

      // Then
      const pendingItems = await PersistenceRouter.getInstance().webhookQueue.getPending();
      expect(pendingItems).toHaveLength(1);
      expect(pendingItems[0].url).toBe(TEST_API_URL);
      expect(pendingItems[0].status).toBe('pending');
      expect(Number(pendingItems[0].retryCount)).toBe(1);
      expect(pendingItems[0].lastError).toContain('Network unreachable');

      const status = dispatcher.getStatus();
      expect(status.state).toBe('queued');
      expect(status.pendingCount).toBe(1);
    });
  });

  describe('When network connection recovers and retryNow is executed', () => {
    it('Then it should redeliver pending items and transition queue back to idle', async () => {
      // Given
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Connection timed out'));
      const dispatcher = WebhookDispatcher.getInstance();
      await dispatcher.enqueue({ event: 'entry_1' }, 'timelog.logged');

      expect((await PersistenceRouter.getInstance().webhookQueue.getPending()).length).toBe(1);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as unknown as Response);

      // When
      await dispatcher.retryNow();

      // Then
      const pendingItems = await PersistenceRouter.getInstance().webhookQueue.getPending();
      expect(pendingItems).toHaveLength(0);

      const status = dispatcher.getStatus();
      expect(status.state).toBe('idle');
      expect(status.pendingCount).toBe(0);
      expect(status.lastDeliveredAt).not.toBeNull();
    });
  });

  describe('When retry threshold is exhausted on an item', () => {
    it('Then it should transition item to failed status and record error state', async () => {
      // Given
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as unknown as Response);

      const dispatcher = WebhookDispatcher.getInstance();

      // When
      await dispatcher.flush();

      // Then
      const pendingItems = await router.webhookQueue.getPending();
      expect(pendingItems).toHaveLength(0);

      const stats = await router.webhookQueue.getStats();
      expect(Number(stats.failed)).toBe(1);

      const status = dispatcher.getStatus();
      expect(status.state).toBe('error');
      expect(status.failedCount).toBe(1);
    });
  });
});
