import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { PersistenceCommands } from '@common/persistence/PersistenceCommands';
import {
  aProject,
  aTask,
  aTimeLog,
  aHolidayLeave,
  aPatchLog,
} from '@tests/shared/builders/entity-builders';

describe('Given PersistenceRouter wired to PersistenceCommands (Tauri IPC)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    PersistenceRouter.getInstance().setImplementationForTesting(
      new PersistenceCommands()
    );
  });

  describe('When core state is requested via load', () => {
    it('Then it should flow get_state command to Tauri and return repository state', async () => {
      // Given
      const mockState: TimerRepositoryState = {
        projects: [aProject({ id: 'p1', name: 'Integration Project' })],
        tasks: [aTask({ id: 't1', projectId: 'p1', name: 'Integration Task' })],
        logs: [],
        activeLog: null,
      };
      mockInvoke.mockResolvedValue(mockState);
      const router = PersistenceRouter.getInstance();

      // When
      const result = await router.core.load();

      // Then
      expect(mockInvoke).toHaveBeenCalledWith('get_state');
      expect(result).toEqual(mockState);
    });
  });

  describe('When core state is overridden', () => {
    it('Then it should invoke override_state command with complete snapshot', async () => {
      // Given
      mockInvoke.mockResolvedValue(undefined);
      const mockState: TimerRepositoryState = {
        projects: [aProject({ id: 'p_override', name: 'Overridden Project' })],
        tasks: [aTask({ id: 't_override', projectId: 'p_override', name: 'Overridden Task' })],
        logs: [aTimeLog({ id: 'l_override', projectId: 'p_override', taskId: 't_override' })],
        activeLog: null,
      };
      const router = PersistenceRouter.getInstance();

      // When
      await router.core.overrideState(mockState);

      // Then
      expect(mockInvoke).toHaveBeenCalledWith('override_state', { state: mockState });
    });
  });

  describe('When a new project is created', () => {
    it('Then it should propagate project properties to add command and return updated state', async () => {
      // Given
      const mockState: TimerRepositoryState = {
        projects: [aProject({ id: 'p1', name: 'New Project', color: '#00ff00' })],
        tasks: [],
        logs: [],
        activeLog: null,
      };
      mockInvoke.mockResolvedValue(mockState);
      const router = PersistenceRouter.getInstance();

      // When
      const result = await router.projects.add({ name: 'New Project', color: '#00ff00' });

      // Then
      expect(mockInvoke).toHaveBeenCalledWith('add', {
        name: 'New Project',
        color: '#00ff00',
        description: null,
        icon: null,
        tags: null,
      });
      expect(result).toEqual(mockState);
    });
  });

  describe('When a time log is deleted', () => {
    it('Then it should invoke delete_time_log command with target log ID', async () => {
      // Given
      mockInvoke.mockResolvedValue(undefined);
      const router = PersistenceRouter.getInstance();

      // When
      await router.timeLogs.delete('log_int_1');

      // Then
      expect(mockInvoke).toHaveBeenCalledWith('delete_time_log', { logId: 'log_int_1' });
    });
  });

  describe('When holidays and patches are queried and saved', () => {
    it('Then it should route requests through respective Tauri IPC commands', async () => {
      // Given
      const mockHolidays = [aHolidayLeave({ id: 'h1', date: '2026-01-01', name: 'New Year' })];
      const mockPatches = [aPatchLog({ id: 'pt1', projectId: 'p1', patchNote: 'Note' })];
      mockInvoke.mockResolvedValueOnce(mockHolidays);
      mockInvoke.mockResolvedValueOnce(undefined);
      mockInvoke.mockResolvedValueOnce(mockPatches);
      mockInvoke.mockResolvedValueOnce(undefined);
      const router = PersistenceRouter.getInstance();

      // When
      const holidays = await router.holidays.getAll();
      await router.holidays.save(mockHolidays);
      const patches = await router.patches.getAll();
      await router.patches.save(mockPatches);

      // Then
      expect(mockInvoke).toHaveBeenCalledWith('get_holidays');
      expect(holidays).toEqual(mockHolidays);
      expect(mockInvoke).toHaveBeenCalledWith('save_holidays', { holidays: mockHolidays });
      expect(mockInvoke).toHaveBeenCalledWith('get_patches');
      expect(patches).toEqual(mockPatches);
      expect(mockInvoke).toHaveBeenCalledWith('save_patches', { patches: mockPatches });
    });
  });

  describe('When uiState, externalApi, and locale configurations are updated', () => {
    it('Then it should persist settings through individual Tauri IPC commands', async () => {
      // Given
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

      // When
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

      // Then
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

  describe('When project rename is requested', () => {
    it('Then it should flow rename_project command directly to Tauri IPC', async () => {
      // Given
      const mockState: TimerRepositoryState = {
        projects: [aProject({ id: 'p1', name: 'Renamed Name' })],
        tasks: [],
        logs: [],
        activeLog: null,
      };
      mockInvoke.mockResolvedValueOnce(mockState);
      const router = PersistenceRouter.getInstance();

      // When
      const result = await router.projects.rename('p1', 'Renamed Name');

      // Then
      expect(mockInvoke).toHaveBeenCalledWith('rename_project', {
        projectId: 'p1',
        name: 'Renamed Name',
      });
      expect(result).toEqual(mockState);
    });
  });

  describe('When granular task operations are requested', () => {
    it('Then it should flow rename_task, get_task_project_id, and get_subtasks to Tauri IPC', async () => {
      // Given
      const mockState: TimerRepositoryState = {
        projects: [],
        tasks: [aTask({ id: 't1', name: 'Renamed Task' })],
        logs: [],
        activeLog: null,
      };
      const mockSubtasks = [aTask({ id: 'st1', parentTaskId: 't1' })];
      mockInvoke
        .mockResolvedValueOnce(mockState)
        .mockResolvedValueOnce('p1')
        .mockResolvedValueOnce(mockSubtasks);
      const router = PersistenceRouter.getInstance();

      // When
      const renameResult = await router.tasks.rename('t1', 'Renamed Task');
      const projectId = await router.tasks.getProjectId('t1');
      const subtasks = await router.tasks.getSubtasks('t1');

      // Then
      expect(mockInvoke).toHaveBeenCalledWith('rename_task', {
        taskId: 't1',
        name: 'Renamed Task',
      });
      expect(renameResult).toEqual(mockState);
      expect(mockInvoke).toHaveBeenCalledWith('get_task_project_id', { taskId: 't1' });
      expect(projectId).toBe('p1');
      expect(mockInvoke).toHaveBeenCalledWith('get_subtasks', { taskId: 't1' });
      expect(subtasks).toEqual(mockSubtasks);
    });
  });
});
