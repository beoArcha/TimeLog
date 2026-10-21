// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BackupTab from '@features/settings/BackupTab';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { setupMatchMediaMock, getMockOxyFlowState } from '@tests/shared/test-helpers';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';

describe('Integration Tests: BackupTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
    window.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('should trigger json blob link creation and download when export button is clicked', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { });
    const mockState = getMockOxyFlowState();

    render(
      <MockProviders state={mockState}>
        <BackupTab />
      </MockProviders>
    );

    const exportBtn = screen.getByTestId('export-backup-btn');
    fireEvent.click(exportBtn);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('should parse json and restore state when valid backup file is imported', async () => {
    const mockState = getMockOxyFlowState();

    render(
      <MockProviders state={mockState}>
        <BackupTab />
      </MockProviders>
    );

    const testProject = aProject({ id: 'p2', name: 'Proj 2', color: 'blue' });
    const testTask = aTask({ id: 't2', projectId: 'p2', name: 'Task 2' });
    const testLog = aTimeLog({ id: 'l2', projectId: 'p2', taskId: 't2', startTime: '2026-06-15T12:00:00Z' });

    const file = new File(
      [
        JSON.stringify({
          version: 1,
          projects: [testProject],
          tasks: [testTask],
          logs: [testLog],
          holidays: [],
          patches: [],
        }),
      ],
      'backup.json',
      { type: 'application/json' }
    );

    const input = screen.getByTestId('import-backup-input');
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(mockState.handleRestoreState).toHaveBeenCalledWith(expect.objectContaining({
        projects: expect.arrayContaining([expect.objectContaining({ id: 'p2' })]),
        tasks: expect.arrayContaining([expect.objectContaining({ id: 't2' })]),
        logs: expect.arrayContaining([expect.objectContaining({ id: 'l2' })]),
      }));
      expect(mockState.showToast).toHaveBeenCalled();
    });
  });

  it('should show toast error and not update state when malformed JSON file is imported', async () => {
    const mockState = getMockOxyFlowState();

    render(
      <MockProviders state={mockState}>
        <BackupTab />
      </MockProviders>
    );

    const file = new File(
      ['invalid json contents'],
      'backup.json',
      { type: 'application/json' }
    );

    const input = screen.getByTestId('import-backup-input');
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(mockState.handleRestoreState).not.toHaveBeenCalled();
      expect(mockState.showToast).toHaveBeenCalled();
    });
  });

  it('should show toast error and reject import when JSON fails schema validation', async () => {
    const mockState = getMockOxyFlowState();

    render(
      <MockProviders state={mockState}>
        <BackupTab />
      </MockProviders>
    );

    // Invalid schema: missing tasks array
    const file = new File(
      [
        JSON.stringify({
          version: 1,
          projects: [aProject()],
        }),
      ],
      'backup.json',
      { type: 'application/json' }
    );

    const input = screen.getByTestId('import-backup-input');
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(mockState.handleRestoreState).not.toHaveBeenCalled();
      expect(mockState.showToast).toHaveBeenCalled();
    });
  });

  it('should expand webhook fields when API integration checkbox is toggled', () => {
    const mockState = getMockOxyFlowState();

    render(
      <MockProviders state={mockState}>
        <BackupTab />
      </MockProviders>
    );

    expect(screen.queryByTestId('api-url-input')).toBeNull();

    const expandHeader = screen.getByTestId('api-push-collapse-header');
    fireEvent.click(expandHeader);

    const toggle = screen.getByTestId('api-push-toggle');
    fireEvent.click(toggle);

    expect(mockState.setLogToApi).toHaveBeenCalledWith(true);
  });
});
