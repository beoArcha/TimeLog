import { describe, it, expect } from 'vitest';
import { validateBackupPayload } from '@common/utils/backupValidator';
import { BackupValidationException } from '@common/exceptions';

describe('Unit Tests: backupValidator', () => {
  const validProject = { id: 'p1', name: 'Project 1', color: 'orange' };
  const validTask = { id: 't1', projectId: 'p1', name: 'Task 1' };
  const validLog = { id: 'l1', taskId: 't1', startTime: '2026-06-15T12:00:00Z' };

  it('should return parsed payload when valid backup structure is provided', () => {
    // Arrange
    const raw = {
      version: 1,
      projects: [validProject],
      tasks: [validTask],
      logs: [validLog],
      holidays: [{ id: 'h1', date: '2026-01-01', name: 'New Year', type: 'holiday' }],
      patches: [{ id: 'pt1', projectId: 'p1', startTime: '2026-06-15T10:00:00Z', endTime: '2026-06-15T11:00:00Z', patchNote: 'Fixed' }],
    };

    // Act
    const result = validateBackupPayload(raw);

    // Assert
    expect(result.version).toBe(1);
    expect(result.projects).toHaveLength(1);
    expect(result.tasks).toHaveLength(1);
    expect(result.logs).toHaveLength(1);
    expect(result.holidays).toHaveLength(1);
    expect(result.patches).toHaveLength(1);
  });

  it('should default version to 1 when valid legacy backup omits version', () => {
    // Arrange
    const raw = {
      projects: [validProject],
      tasks: [validTask],
      logs: [validLog],
    };

    // Act
    const result = validateBackupPayload(raw);

    // Assert
    expect(result.version).toBe(1);
    expect(result.holidays).toBeUndefined();
    expect(result.patches).toBeUndefined();
  });

  it('should throw BackupValidationException when payload is null or not an object', () => {
    // Arrange & Act & Assert
    expect(() => validateBackupPayload(null)).toThrow(BackupValidationException);
    expect(() => validateBackupPayload('string')).toThrow(BackupValidationException);
    expect(() => validateBackupPayload([])).toThrow(BackupValidationException);
  });

  it('should throw BackupValidationException when version is invalid', () => {
    // Arrange
    const raw = { version: 0, projects: [], tasks: [], logs: [] };

    // Act & Assert
    expect(() => validateBackupPayload(raw)).toThrow(BackupValidationException);
  });

  it('should throw BackupValidationException when required arrays are missing', () => {
    // Arrange
    const missingProjects = { tasks: [], logs: [] };
    const missingTasks = { projects: [], logs: [] };
    const missingLogs = { projects: [], tasks: [] };

    // Act & Assert
    expect(() => validateBackupPayload(missingProjects)).toThrow(BackupValidationException);
    expect(() => validateBackupPayload(missingTasks)).toThrow(BackupValidationException);
    expect(() => validateBackupPayload(missingLogs)).toThrow(BackupValidationException);
  });

  it('should throw BackupValidationException when project entry is invalid', () => {
    // Arrange
    const invalidProj = { projects: [{ id: '', name: 'P', color: 'red' }], tasks: [], logs: [] };

    // Act & Assert
    expect(() => validateBackupPayload(invalidProj)).toThrow(BackupValidationException);
  });

  it('should migrate a legacy project with a missing color to the default violet color', () => {
    // Arrange
    const missingColor = { projects: [{ id: 'p1', name: 'P' }], tasks: [], logs: [] };

    // Act
    const result = validateBackupPayload(missingColor);

    // Assert
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].color).toBe('violet');
  });

  it('should throw BackupValidationException when task entry is missing projectId or name', () => {
    // Arrange
    const missingProjId = { projects: [validProject], tasks: [{ id: 't1', name: 'T' }], logs: [] };

    // Act & Assert
    expect(() => validateBackupPayload(missingProjId)).toThrow(BackupValidationException);
  });

  it('should throw BackupValidationException when log entry is missing taskId or startTime', () => {
    // Arrange
    const missingStartTime = { projects: [validProject], tasks: [validTask], logs: [{ id: 'l1', taskId: 't1' }] };

    // Act & Assert
    expect(() => validateBackupPayload(missingStartTime)).toThrow(BackupValidationException);
  });

  it('should throw BackupValidationException when optional arrays are not arrays', () => {
    // Arrange
    const invalidHolidays = { projects: [], tasks: [], logs: [], holidays: 'invalid' };
    const invalidPatches = { projects: [], tasks: [], logs: [], patches: 123 };

    // Act & Assert
    expect(() => validateBackupPayload(invalidHolidays)).toThrow(BackupValidationException);
    expect(() => validateBackupPayload(invalidPatches)).toThrow(BackupValidationException);
  });
});
