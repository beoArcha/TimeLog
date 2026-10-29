import { describe, it, expect } from 'vitest';
import { migrateLegacyBackup } from '@common/utils/backupMigrator';
import { validateBackupPayload } from '@common/utils/backupValidator';

describe('Unit Tests: backupMigrator', () => {
  it('should migrate nested state dump from legacy localStorage export', () => {
    // Arrange
    const legacyDump = {
      state: {
        projects: [{ id: 'p-leg', name: 'Legacy Proj' }],
        tasks: [{ id: 't-leg', projectId: 'p-leg', name: 'Legacy Task' }],
        logs: [{ id: 'l-leg', taskId: 't-leg', projectId: 'p-leg', startTime: '2026-01-01T10:00:00Z' }],
      },
    };

    // Act
    const migrated = migrateLegacyBackup(legacyDump);
    const validated = validateBackupPayload(legacyDump);

    // Assert
    expect(migrated.projects).toHaveLength(1);
    expect((migrated.projects as Array<{ color: string }>)[0].color).toBe('violet');
    expect(validated.projects[0].name).toBe('Legacy Proj');
    expect(validated.projects[0].color).toBe('violet');
    expect(validated.tasks).toHaveLength(1);
    expect(validated.logs).toHaveLength(1);
  });

  it('should return primitive or null values untouched', () => {
    expect(migrateLegacyBackup(null)).toBeNull();
    expect(migrateLegacyBackup(undefined)).toBeUndefined();
    expect(migrateLegacyBackup('string')).toBe('string');
  });
});
