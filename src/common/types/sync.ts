/**
 * Asynchronous sync lifecycle state.
 */
export type SyncStateType = 'idle' | 'syncing' | 'queued' | 'error';

/**
 * Snapshot contract for synchronization status.
 */
export interface SyncStatusSnapshot {
  state: SyncStateType;
  pendingCount?: number;
  failedCount?: number;
  lastError?: string | null;
  lastDeliveredAt?: string | null;
}
