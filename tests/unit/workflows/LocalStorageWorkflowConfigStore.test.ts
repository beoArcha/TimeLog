import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LocalStorageWorkflowConfigStore } from '@plugins/workflows/LocalStorageWorkflowConfigStore';
import { DEFAULT_WORKFLOW_CONFIG } from '@common/workflows/IWorkflow';
import { STORAGE_KEYS } from '@common/constants/storage-keys';
import { aWorkflowConfig } from '@tests/shared/builders/entity-builders';

describe('LocalStorageWorkflowConfigStore', () => {
  let store: LocalStorageWorkflowConfigStore;

  beforeEach(() => {
    localStorage.clear();
    store = new LocalStorageWorkflowConfigStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return DEFAULT_WORKFLOW_CONFIG when no config is stored in localStorage', async () => {
    // Arrange: localStorage is empty

    // Act
    const config = await store.getConfig();

    // Assert
    expect(config).toEqual(DEFAULT_WORKFLOW_CONFIG);
  });

  it('should return merged configuration when valid config is stored in localStorage', async () => {
    // Arrange
    const saved = aWorkflowConfig({
      autoStopHoursLimitEnabled: true,
      autoStopHoursLimit: 6,
      autoStopDailyBoundaryTime: '20:00',
    });
    localStorage.setItem(STORAGE_KEYS.WORKFLOW_CONFIG, JSON.stringify(saved));

    // Act
    const config = await store.getConfig();

    // Assert
    expect(config.autoStopHoursLimitEnabled).toBe(true);
    expect(config.autoStopHoursLimit).toBe(6);
    expect(config.autoStopDailyBoundaryTime).toBe('20:00');
  });

  it('should fall back to DEFAULT_WORKFLOW_CONFIG when stored JSON is invalid', async () => {
    // Arrange
    localStorage.setItem(STORAGE_KEYS.WORKFLOW_CONFIG, 'invalid-json-{[');

    // Act
    const config = await store.getConfig();

    // Assert
    expect(config).toEqual(DEFAULT_WORKFLOW_CONFIG);
  });

  it('should serialize and save configuration to localStorage', async () => {
    // Arrange
    const custom = aWorkflowConfig({
      autoStopHoursLimitEnabled: true,
      autoStopHoursLimit: 10,
    });

    // Act
    await store.saveConfig(custom);

    // Assert
    const stored = localStorage.getItem(STORAGE_KEYS.WORKFLOW_CONFIG);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.autoStopHoursLimit).toBe(10);
  });
});
