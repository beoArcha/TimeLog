// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OxyContext } from '@common/providers/OxyContext';
import BackupTab from '../../../src/layout/tabs/BackupTab';
import { setupMatchMediaMock, getMockOxyFlowState } from '../../shared/test-helpers';

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
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const mockState = getMockOxyFlowState();

    render(
      <OxyContext.Provider value={mockState}>
        <BackupTab />
      </OxyContext.Provider>
    );

    const exportBtn = screen.getByTestId('export-backup-btn');
    fireEvent.click(exportBtn);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('Given BackupTab rendered, When import file is selected, Then it should parse json and set appropriate states', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const mockState = getMockOxyFlowState();

    render(
      <OxyContext.Provider value={mockState}>
        <BackupTab />
      </OxyContext.Provider>
    );

    const file = new File(
      [
        JSON.stringify({
          projects: [{ id: 'p2' }],
          tasks: [{ id: 't2' }],
          logs: [{ id: 'l2' }],
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
      expect(mockState.setProjects).toHaveBeenCalledWith(expect.any(Array));
      expect(mockState.setTasks).toHaveBeenCalledWith(expect.any(Array));
      expect(mockState.setLogs).toHaveBeenCalledWith(expect.any(Array));
      expect(alertSpy).toHaveBeenCalled();
    });
  });

  it('Given BackupTab rendered, When invalid JSON file is imported, Then it should show failure alert dialog and not update states', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const mockState = getMockOxyFlowState();

    render(
      <OxyContext.Provider value={mockState}>
        <BackupTab />
      </OxyContext.Provider>
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
      expect(mockState.setProjects).not.toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid'));
    });
  });

  it('Given BackupTab rendered, When API integration checkbox is toggled, Then it should expand the webhook input fields', () => {
    const mockState = getMockOxyFlowState();

    render(
      <OxyContext.Provider value={mockState}>
        <BackupTab />
      </OxyContext.Provider>
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
