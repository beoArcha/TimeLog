import { describe, it, expect, beforeEach } from 'vitest';
import { CORE_HANDLERS } from '@tests/shared/mocks/handlers/core-handlers';
import { PROJECT_HANDLERS } from '@tests/shared/mocks/handlers/project-handlers';
import { TASK_HANDLERS } from '@tests/shared/mocks/handlers/task-handlers';
import { TIMER_HANDLERS } from '@tests/shared/mocks/handlers/timer-handlers';
import { TIMELOG_HANDLERS } from '@tests/shared/mocks/handlers/timelog-handlers';
import { SETTINGS_HANDLERS } from '@tests/shared/mocks/handlers/settings-handlers';
import { AUXILIARY_HANDLERS } from '@tests/shared/mocks/handlers/auxiliary-handlers';
import { getMockDbState, saveMockDbState } from '@tests/shared/mocks/state';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';

describe('Domain Mock Handlers', () => {
  beforeEach(() => {
    localStorage.clear();
    saveMockDbState({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });
  });

  describe('CORE_HANDLERS', () => {
    it('should override and reset state correctly', async () => {
      // Act
      await CORE_HANDLERS.override_state({
        state: {
          projects: [aProject({ id: 'p-1', name: 'Mock Project' })],
        },
      });

      // Assert
      const state = getMockDbState();
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0].name).toBe('Mock Project');

      // Act
      await CORE_HANDLERS.reset({});

      // Assert
      const resetState = getMockDbState();
      expect(resetState.projects).toHaveLength(0);
    });
  });

  describe('PROJECT_HANDLERS', () => {
    it('should add, toggle archive, update, and rename projects', async () => {
      // Act
      await PROJECT_HANDLERS.add({ name: 'Project Alpha', color: '#ff0000' });

      // Assert
      let state = getMockDbState();
      expect(state.projects).toHaveLength(1);
      const projId = state.projects[0].id;

      // Act
      await PROJECT_HANDLERS.toggle_archive({ projectId: projId });
      state = getMockDbState();
      expect(state.projects[0].archived).toBe(true);

      // Act
      await PROJECT_HANDLERS.rename({ projectId: projId, name: 'Renamed Alpha' });
      state = getMockDbState();
      expect(state.projects[0].name).toBe('Renamed Alpha');
    });
  });

  describe('TASK_HANDLERS', () => {
    it('should add, update, and delete tasks with cascading', async () => {
      // Arrange
      saveMockDbState({
        projects: [aProject({ id: 'p-1' })],
        tasks: [],
        logs: [],
        activeLog: null,
      });

      // Act
      await TASK_HANDLERS.add_task({ projectId: 'p-1', name: 'Parent Task' });
      let state = getMockDbState();
      const parentId = state.tasks[0].id;

      await TASK_HANDLERS.add_task({ projectId: 'p-1', name: 'Child Task', parentTaskId: parentId });
      state = getMockDbState();
      expect(state.tasks).toHaveLength(2);

      const subtasks = (await TASK_HANDLERS.get_subtasks({ taskId: parentId })) as unknown[];
      expect(subtasks).toHaveLength(1);

      // Act - cascade delete
      await TASK_HANDLERS.delete_task({ taskId: parentId });
      state = getMockDbState();
      expect(state.tasks).toHaveLength(0);
    });
  });

  describe('TIMER_HANDLERS and TIMELOG_HANDLERS', () => {
    it('should start timer, create logs, and stop timer cleanly', async () => {
      // Arrange
      saveMockDbState({
        projects: [aProject({ id: 'p-1' })],
        tasks: [aTask({ id: 't-1', projectId: 'p-1' })],
        logs: [],
        activeLog: null,
      });

      // Act
      await TIMER_HANDLERS.start_timer({ taskId: 't-1' });
      let state = getMockDbState();
      expect(state.activeLog).not.toBeNull();
      expect(state.activeLog?.taskId).toBe('t-1');

      // Act
      await TIMER_HANDLERS.stop_timer({});
      state = getMockDbState();
      expect(state.activeLog).toBeNull();
      expect(state.logs[0].endTime).not.toBeNull();

      // Act - delete log
      const logId = state.logs[0].id;
      await TIMELOG_HANDLERS.delete_time_log({ logId });
      state = getMockDbState();
      expect(state.logs).toHaveLength(0);
    });
  });

  describe('SETTINGS_HANDLERS and AUXILIARY_HANDLERS', () => {
    it('should store and retrieve settings, holidays, and locale data', async () => {
      // Act
      await SETTINGS_HANDLERS.save({
        settings: { autoStart: true, theme: 'dark' } as never,
      });
      const settings = (await SETTINGS_HANDLERS.get({})) as { autoStart: boolean; theme: string };
      expect(settings.autoStart).toBe(true);

      // Act
      await AUXILIARY_HANDLERS.save_holidays({ holidays: [{ id: 'h-1', name: 'New Year' }] });
      const holidays = (await AUXILIARY_HANDLERS.get_holidays({})) as unknown[];
      expect(holidays).toHaveLength(1);

      // Act
      await AUXILIARY_HANDLERS.save_locale({ locale: 'pl-PL' });
      const loc = await AUXILIARY_HANDLERS.get_locale({});
      expect(loc).toBe('pl-PL');
    });
  });
});
