import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';

import { PersistenceCommands } from '@common/persistence/PersistenceCommands';

describe('Integration Tests: PersistenceRouter & PersistenceCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    PersistenceRouter.getInstance().setImplementationForTesting(
      new PersistenceCommands()
    );
  });

  it('should flow load call from Router to mock Tauri and return correct state', async () => {
    const mockState: TimerRepositoryState = {
      projects: [{ id: 'p1', name: 'Integration Project', color: '#ff0000', archived: false, createdAt: '2026' }],
      tasks: [{ id: 't1', projectId: 'p1', name: 'Integration Task', completed: false, createdAt: '2026' }],
      logs: [],
      activeLog: null,
    };

    mockInvoke.mockResolvedValue(mockState);

    const router = PersistenceRouter.getInstance();
    const result = await router.core.load();

    expect(mockInvoke).toHaveBeenCalledWith('get_state');
    expect(result).toEqual(mockState);
  });

  it('should flow addProject from Router to mock Tauri and propagate correct args', async () => {
    const mockState: TimerRepositoryState = {
      projects: [{ id: 'p1', name: 'New Project', color: '#00ff00', archived: false, createdAt: '2026' }],
      tasks: [],
      logs: [],
      activeLog: null,
    };

    mockInvoke.mockResolvedValue(mockState);

    const router = PersistenceRouter.getInstance();
    const result = await router.projects.add({ name: 'New Project', color: '#00ff00' });

    expect(mockInvoke).toHaveBeenCalledWith('add', {
      name: 'New Project',
      color: '#00ff00',
      description: null,
      icon: null,
      tags: null,
    });
    expect(result).toEqual(mockState);
  });

  it('should flow delete time log from Router to mock Tauri and invoke delete_time_log', async () => {
    // Arrange
    mockInvoke.mockResolvedValue(undefined);
    const router = PersistenceRouter.getInstance();

    // Act
    await router.timeLogs.delete('log_int_1');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('delete_time_log', { logId: 'log_int_1' });
  });

  it('should flow holidays and patches from Router to mock Tauri', async () => {
    // Arrange
    const mockHolidays = [{ id: 'h1', date: '2026-01-01', type: 'holiday' as const, name: 'New Year' }];
    const mockPatches = [{ id: 'pt1', projectId: 'p1', startTime: '10:00', endTime: '11:00', patchNote: 'Note' }];
    mockInvoke.mockResolvedValueOnce(mockHolidays);
    mockInvoke.mockResolvedValueOnce(undefined);
    mockInvoke.mockResolvedValueOnce(mockPatches);
    mockInvoke.mockResolvedValueOnce(undefined);
    const router = PersistenceRouter.getInstance();

    // Act
    const holidays = await router.holidays.getAll();
    await router.holidays.save(mockHolidays);
    const patches = await router.patches.getAll();
    await router.patches.save(mockPatches);

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('get_holidays');
    expect(holidays).toEqual(mockHolidays);
    expect(mockInvoke).toHaveBeenCalledWith('save_holidays', { holidays: mockHolidays });
    expect(mockInvoke).toHaveBeenCalledWith('get_patches');
    expect(patches).toEqual(mockPatches);
    expect(mockInvoke).toHaveBeenCalledWith('save_patches', { patches: mockPatches });
  });

  it('should flow uiState, externalApi, and locale configurations from Router to mock Tauri', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce('p_saved');
    mockInvoke.mockResolvedValueOnce(undefined);
    mockInvoke.mockResolvedValueOnce('mini');
    mockInvoke.mockResolvedValueOnce(undefined);
    mockInvoke.mockResolvedValueOnce({ logToApi: true, apiToken: 't', apiUrl: 'u', apiMethod: 'POST', apiHeaders: '' });
    mockInvoke.mockResolvedValueOnce(undefined);
    mockInvoke.mockResolvedValueOnce('pl');
    mockInvoke.mockResolvedValueOnce(undefined);
    mockInvoke.mockResolvedValueOnce('pl-PL');
    mockInvoke.mockResolvedValueOnce(undefined);
    mockInvoke.mockResolvedValueOnce(JSON.stringify({ pl: { a: 'b' } }));
    mockInvoke.mockResolvedValueOnce(undefined);
    const router = PersistenceRouter.getInstance();

    // Act
    const projId = await router.uiState.getCurrentProjectId();
    await router.uiState.saveCurrentProjectId('p_new');
    const variant = await router.uiState.getLastNonCompactVariant();
    await router.uiState.saveLastNonCompactVariant('full');
    const apiSettings = await router.externalApi.getSettings();
    await router.externalApi.saveSettings(apiSettings);
    const pref = await router.locale.getLocalePref();
    await router.locale.saveLocalePref('en');
    const loc = await router.locale.getLocale();
    await router.locale.saveLocale('en-US');
    const custom = await router.locale.getCustomTranslations();
    await router.locale.saveCustomTranslations(custom);

    // Assert
    expect(projId).toBe('p_saved');
    expect(mockInvoke).toHaveBeenCalledWith('save_current_project_id', { id: 'p_new' });
    expect(variant).toBe('mini');
    expect(mockInvoke).toHaveBeenCalledWith('save_last_non_compact_variant', { variant: 'full' });
    expect(apiSettings.logToApi).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith('save_external_api_settings', { settings: apiSettings });
    expect(pref).toBe('pl');
    expect(mockInvoke).toHaveBeenCalledWith('save_locale_pref', { pref: 'en' });
    expect(loc).toBe('pl-PL');
    expect(mockInvoke).toHaveBeenCalledWith('save_locale', { locale: 'en-US' });
    expect(custom).toEqual({ pl: { a: 'b' } });
    expect(mockInvoke).toHaveBeenCalledWith('save_custom_translations', {
      translations: JSON.stringify({ pl: { a: 'b' } }),
    });
  });
});
