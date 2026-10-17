import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BackupTab from '@features/settings/BackupTab';
import { setupMatchMediaMock, getMockOxyFlowState } from '@tests/shared/test-helpers';

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

  it('Given BackupTab rendered, When export button is clicked, Then it should trigger json blob link creation and download', () => {
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

  it('Given BackupTab rendered, When import file is selected, Then it should parse json and set appropriate states', async () => {
    const mockState = getMockOxyFlowState();

    render(
      <MockProviders state={mockState}>
        <BackupTab />
      </MockProviders>
    );

    const file = new File(
      [
        JSON.stringify({
          projects: [{ id: 'p2', name: 'Proj 2', color: 'blue' }],
          tasks: [{ id: 't2', projectId: 'p2', name: 'Task 2' }],
          logs: [{ id: 'l2', taskId: 't2', startTime: '2026-06-15T12:00:00Z' }],
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
        projects: expect.any(Array),
        tasks: expect.any(Array),
        logs: expect.any(Array),
      }));
      expect(mockState.showToast).toHaveBeenCalled();
    });
  });

  it('Given BackupTab rendered, When invalid JSON file is imported, Then it should show failure alert dialog and not update states', async () => {
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

  it('Given BackupTab rendered, When API integration checkbox is toggled, Then it should expand the webhook input fields', () => {
    const mockState = getMockOxyFlowState();

    render(
      <MockProviders state={mockState}>
        <BackupTab />
      </MockProviders>
    );

    // Webhook inputs should not be visible when logToApi is false
    expect(screen.queryByTestId('api-url-input')).toBeNull();

    // Expand the API integration collapsible card first
    const expandHeader = screen.getByTestId('api-push-collapse-header');
    fireEvent.click(expandHeader);

    // Click to toggle API push integration
    const toggle = screen.getByTestId('api-push-toggle');
    fireEvent.click(toggle);

    expect(mockState.setLogToApi).toHaveBeenCalledWith(true);
  });
});
