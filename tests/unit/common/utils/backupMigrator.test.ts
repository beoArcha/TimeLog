import { describe, it, expect } from 'vitest';
import { migrateLegacyBackup } from '@common/utils/backupMigrator';
import { validateBackupPayload } from '@common/utils/backupValidator';

describe('backupMigrator', () => {
  it('should normalize missing project colors to violet when given root-level state payload', () => {
    // Arrange
    const rootPayload = {
      projects: [{ id: 'p-1', name: 'Root Project' }],
      tasks: [{ id: 't-1', projectId: 'p-1', name: 'Task 1' }],
    };

    // Act
    const migrated = migrateLegacyBackup(rootPayload);

    // Assert
    expect(migrated.projects).toHaveLength(1);
    expect((migrated.projects as Array<{ id: string; name: string; color: string }>)[0]).toEqual({
      id: 'p-1',
      name: 'Root Project',
      color: 'violet',
    });
  });

  it('should extract nested state and normalize project colors when given nested object payload', () => {
    // Arrange
    const nestedPayload = {
      state: {
        projects: [{ id: 'p-leg', name: 'Legacy Proj' }],
        tasks: [{ id: 't-leg', projectId: 'p-leg', name: 'Legacy Task' }],
        logs: [{ id: 'l-leg', taskId: 't-leg', projectId: 'p-leg', startTime: '2026-01-01T10:00:00Z' }],
      },
    };

    // Act
    const migrated = migrateLegacyBackup(nestedPayload);

    // Assert
    expect(migrated.projects).toHaveLength(1);
    expect((migrated.projects as Array<{ id: string; name: string; color: string }>)[0].color).toBe('violet');
    expect(migrated.tasks).toHaveLength(1);
    expect(migrated.logs).toHaveLength(1);
  });

  it('should parse stringified nested state and normalize projects when given stringified state payload', () => {
    // Arrange
    const stringifiedPayload = {
      version: '1.0.0',
      state: JSON.stringify({
        projects: [{ id: 'p-str', name: 'Stringified Proj' }],
        tasks: [{ id: 't-str', projectId: 'p-str', name: 'Stringified Task' }],
      }),
    };

    // Act
    const migrated = migrateLegacyBackup(stringifiedPayload);

    // Assert
    expect(migrated.projects).toHaveLength(1);
    expect((migrated.projects as Array<{ id: string; name: string; color: string }>)[0].color).toBe('violet');
    expect((migrated.tasks as Array<{ id: string }>)[0].id).toBe('t-str');
  });

  it('should give precedence to root collections while preserving nested fallbacks when collections conflict', () => {
    // Arrange
    const hybridPayload = {
      projects: [{ id: 'p-root', name: 'Root Proj', color: 'blue' }],
      state: {
        projects: [{ id: 'p-nested', name: 'Nested Proj' }],
        tasks: [{ id: 't-nested', projectId: 'p-nested', name: 'Nested Task' }],
      },
    };

    // Act
    const migrated = migrateLegacyBackup(hybridPayload);

    // Assert
    expect((migrated.projects as Array<{ id: string; name: string; color: string }>)[0]).toEqual({
      id: 'p-root',
      name: 'Root Proj',
      color: 'blue',
    });
    expect((migrated.tasks as Array<{ id: string }>)[0].id).toBe('t-nested');
  });

  it('should ignore nested state safely when state string contains invalid json', () => {
    // Arrange
    const corruptedPayload = {
      projects: [{ id: 'p-ok', name: 'Valid Proj', color: 'green' }],
      state: 'broken-json-{{{',
    };

    // Act
    const migrated = migrateLegacyBackup(corruptedPayload);

    // Assert
    expect(migrated.projects).toHaveLength(1);
    expect((migrated.projects as Array<{ id: string }>)[0].id).toBe('p-ok');
  });

  it('should return primitive or non-object values untouched when raw input is not a plain object', () => {
    // Arrange
    const rawPrimitive = 'primitive-string';

    // Act
    const result = migrateLegacyBackup(rawPrimitive);

    // Assert
    expect(result).toBe('primitive-string');
  });

  it('should successfully validate migrated payload through validateBackupPayload when given legacy dump', () => {
    // Arrange
    const legacyDump = {
      state: {
        projects: [{ id: 'p-leg', name: 'Legacy Proj' }],
        tasks: [{ id: 't-leg', projectId: 'p-leg', name: 'Legacy Task' }],
        logs: [{ id: 'l-leg', taskId: 't-leg', projectId: 'p-leg', startTime: '2026-01-01T10:00:00Z' }],
      },
    };

    // Act
    const validated = validateBackupPayload(legacyDump);

    // Assert
    expect(validated.projects[0].name).toBe('Legacy Proj');
    expect(validated.projects[0].color).toBe('violet');
    expect(validated.tasks).toHaveLength(1);
    expect(validated.logs).toHaveLength(1);
  });
});
