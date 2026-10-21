import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportDatabaseAsJson } from '@common/utils/databaseExport';

describe('Unit Tests: databaseExport', () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;
  const mockCreateObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-url');
  const mockRevokeObjectURL = vi.fn();

  beforeEach(() => {
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = mockCreateObjectURL;
    URL.revokeObjectURL = mockRevokeObjectURL;
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('should trigger anchor click and revoke URL when exporting database', () => {
    // Arrange
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const data = {
      projects: [{ id: 'p1', name: 'Project 1', color: 'orange', createdAt: '2026', archived: false, description: null, icon: null, tags: null }],
      tasks: [{ id: 't1', projectId: 'p1', name: 'Task 1', completed: false, createdAt: '2026', status: null, parentTaskId: null }],
      logs: [],
    };

    // Act
    exportDatabaseAsJson(data);

    // Assert
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(anchorClickSpy).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/mock-url');
  });

  it('should use provided custom filename prefix when specified', () => {
    // Arrange
    let createdDownload = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      createdDownload = this.download;
    });

    const data = { projects: [], tasks: [], logs: [] };

    // Act
    exportDatabaseAsJson(data, 'Custom_Backup');

    // Assert
    expect(createdDownload).toMatch(/^Custom_Backup_\d{4}-\d{2}-\d{2}\.json$/);
  });
});
