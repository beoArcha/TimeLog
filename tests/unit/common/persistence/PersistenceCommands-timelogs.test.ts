import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { PersistenceCommands } from '@common/persistence/PersistenceCommands';
import { ErrorHandler } from '@common/exceptions';
import { aHolidayLeave, aPatchLog, aTimeLog } from '@tests/shared/builders/entity-builders';

describe('Unit Tests: PersistenceCommands - TimeLogs, Holidays, Patches', () => {
  let commands: PersistenceCommands;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ErrorHandler, 'handle').mockImplementation(() => {});
    commands = new PersistenceCommands();
  });

  describe('timeLogs persistence', () => {
    it('should invoke all timeLogs persistence commands when called', async () => {
      // Arrange
      const mockLog = aTimeLog({ id: 'l1', taskId: 't1' });
      mockInvoke.mockResolvedValue([mockLog]);

      // Act
      const forTask = await commands.timeLogs.getForTask('t1');
      await commands.timeLogs.closeActiveByProject('2026-01-01T01:00:00Z', 'p1');
      await commands.timeLogs.closeAllActive('2026-01-01T01:00:00Z');
      await commands.timeLogs.insert('l2', 't1', '2026-01-01T02:00:00Z');
      mockInvoke.mockResolvedValue(['l1']);
      const activeIds = await commands.timeLogs.queryActive();
      mockInvoke.mockResolvedValue([mockLog]);
      const allLogs = await commands.timeLogs.getAll();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_for_task', { taskId: 't1' });
      expect(mockInvoke).toHaveBeenCalledWith('close_active_by_project', {
        endTime: '2026-01-01T01:00:00Z',
        projectId: 'p1',
      });
      expect(mockInvoke).toHaveBeenCalledWith('close_all_active', {
        endTime: '2026-01-01T01:00:00Z',
      });
      expect(mockInvoke).toHaveBeenCalledWith('insert', {
        logId: 'l2',
        taskId: 't1',
        startTime: '2026-01-01T02:00:00Z',
      });
      expect(mockInvoke).toHaveBeenCalledWith('query_active');
      expect(activeIds).toEqual(['l1']);
      expect(mockInvoke).toHaveBeenCalledWith('get_all');
      expect(allLogs).toEqual([mockLog]);
      expect(forTask).toEqual([mockLog]);
    });

    it('should invoke delete_time_log when delete is called', async () => {
      // Arrange
      mockInvoke.mockResolvedValue(undefined);

      // Act
      await commands.timeLogs.delete('log_del_1');

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('delete_time_log', { logId: 'log_del_1' });
    });

    it('should report exception and rethrow when delete fails', async () => {
      // Arrange
      mockInvoke.mockRejectedValue(new Error('Tauri delete log error'));

      // Act & Assert
      await expect(commands.timeLogs.delete('log_del_fail')).rejects.toThrow('Tauri delete log error');
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });
  });

  describe('holidays persistence', () => {
    it('should invoke get_holidays and return list when getAll is called', async () => {
      // Arrange
      const mockHolidays = [aHolidayLeave({ id: 'hol_1', name: 'Test Holiday' })];
      mockInvoke.mockResolvedValue(mockHolidays);

      // Act
      const result = await commands.holidays.getAll();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_holidays');
      expect(result).toEqual(mockHolidays);
    });

    it('should invoke save_holidays with payload when save is called', async () => {
      // Arrange
      const mockHolidays = [aHolidayLeave({ id: 'hol_1' })];
      mockInvoke.mockResolvedValue(undefined);

      // Act
      await commands.holidays.save(mockHolidays);

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('save_holidays', { holidays: mockHolidays });
    });

    it('should report exception and rethrow when holidays invocation fails', async () => {
      // Arrange
      mockInvoke.mockRejectedValue(new Error('Holidays error'));

      // Act & Assert
      await expect(commands.holidays.getAll()).rejects.toThrow('Holidays error');
      await expect(commands.holidays.save([])).rejects.toThrow('Holidays error');
      expect(ErrorHandler.handle).toHaveBeenCalledTimes(2);
    });
  });

  describe('patches persistence', () => {
    it('should invoke get_patches and return list when getAll is called', async () => {
      // Arrange
      const mockPatches = [aPatchLog({ id: 'pat_1' })];
      mockInvoke.mockResolvedValue(mockPatches);

      // Act
      const result = await commands.patches.getAll();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_patches');
      expect(result).toEqual(mockPatches);
    });

    it('should invoke save_patches with payload when save is called', async () => {
      // Arrange
      const mockPatches = [aPatchLog({ id: 'pat_1' })];
      mockInvoke.mockResolvedValue(undefined);

      // Act
      await commands.patches.save(mockPatches);

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('save_patches', { patches: mockPatches });
    });

    it('should report exception and rethrow when patches invocation fails', async () => {
      // Arrange
      mockInvoke.mockRejectedValue(new Error('Patches error'));

      // Act & Assert
      await expect(commands.patches.getAll()).rejects.toThrow('Patches error');
      await expect(commands.patches.save([])).rejects.toThrow('Patches error');
      expect(ErrorHandler.handle).toHaveBeenCalledTimes(2);
    });
  });
});
