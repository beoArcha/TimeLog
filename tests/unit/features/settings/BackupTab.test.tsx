import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BackupTab from '@features/settings/BackupTab';
import { getMockOxyFlowState, OxyFlowState } from '@tests/shared/test-helpers';
import { ErrorHandler } from '@common/exceptions';

describe('Unit Tests: BackupTab', () => {
  let mockState: OxyFlowState;
  const handleRestoreStateMock = vi.fn();
  const setProjectsMock = vi.fn();
  const setTasksMock = vi.fn();
  const setLogsMock = vi.fn();
  const setHolidaysMock = vi.fn();
  const setPatchesMock = vi.fn();
  const setLogToApiMock = vi.fn();
  const setApiUrlMock = vi.fn();
  const setApiTokenMock = vi.fn();
  const setApiMethodMock = vi.fn();
  const setApiHeadersMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      ...getMockOxyFlowState(),
      locale: 'en',
      customTranslations: {},
      resolvedTheme: 'dark',
      handleRestoreState: handleRestoreStateMock,
      setProjects: setProjectsMock,
      setTasks: setTasksMock,
      setLogs: setLogsMock,
      setHolidays: setHolidaysMock,
      setPatches: setPatchesMock,
      logToApi: false,
      setLogToApi: setLogToApiMock,
      apiUrl: '',
      setApiUrl: setApiUrlMock,
      apiToken: '',
      setApiToken: setApiTokenMock,
      apiMethod: 'POST',
      setApiMethod: setApiMethodMock,
      apiHeaders: '',
      setApiHeaders: setApiHeadersMock,
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('should render backup tab components and import form', () => {
    render(
      <MockProviders state={mockState}>
        <BackupTab />
      </MockProviders>
    );

    expect(screen.getByTestId('export-backup-btn')).not.toBeNull();
    expect(screen.getByTestId('import-backup-btn')).not.toBeNull();
  });

  it('should trigger browser download when export button is clicked', () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/test');
    const revokeObjectURLMock = vi.fn();
    const originalCreateObjectURL = window.URL.createObjectURL;
    const originalRevokeObjectURL = window.URL.revokeObjectURL;
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(
      <MockProviders state={mockState}>
        <BackupTab />
      </MockProviders>
    );

    const exportBtn = screen.getByTestId('export-backup-btn');
    fireEvent.click(exportBtn);

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(anchorClickSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/test');

    anchorClickSpy.mockRestore();
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('should trigger hidden file input when import button is clicked', () => {
    render(
      <MockProviders state={mockState}>
        <BackupTab />
      </MockProviders>
    );

    const fileInput = screen.getByTestId('import-backup-input');
    const inputClickSpy = vi.spyOn(fileInput, 'click');

    const importBtn = screen.getByTestId('import-backup-btn');
    fireEvent.click(importBtn);

    expect(inputClickSpy).toHaveBeenCalled();
    inputClickSpy.mockRestore();
  });

  it('should do nothing when file input change has no files', () => {
    render(
      <MockProviders state={mockState}>
        <BackupTab />
      </MockProviders>
    );

    const input = screen.getByTestId('import-backup-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });

    expect(handleRestoreStateMock).not.toHaveBeenCalled();
  });

  it('should trigger restore state when valid JSON is imported', async () => {
    const showToastMock = vi.fn();
    render(
      <MockProviders state={{ ...mockState, showToast: showToastMock }}>
        <BackupTab />
      </MockProviders>
    );

    const input = screen.getByTestId('import-backup-input') as HTMLInputElement;
    const backupData = {
      projects: [{ id: 'p1', name: 'Project 1', color: '#ff0000', archived: false }],
      tasks: [{ id: 't1', projectId: 'p1', name: 'Task 1', status: 'todo' }],
      logs: [{ id: 'l1', taskId: 't1', startTime: '2026-06-15T10:00:00Z' }],
      holidays: [],
      patches: [],
    };
    const file = new File([JSON.stringify(backupData)], 'backup.json', { type: 'application/json' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(handleRestoreStateMock).toHaveBeenCalledWith(expect.objectContaining({
        projects: expect.any(Array),
        tasks: expect.any(Array),
        logs: expect.any(Array),
      }));
      expect(showToastMock).toHaveBeenCalled();
    });
  });

  it('should handle invalid JSON import gracefully via ErrorHandler and showToast', async () => {
    const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle').mockImplementation(() => {});
    const showToastMock = vi.fn();

    render(
      <MockProviders state={{ ...mockState, showToast: showToastMock }}>
        <BackupTab />
      </MockProviders>
    );

    const input = screen.getByTestId('import-backup-input') as HTMLInputElement;
    const corruptedFile = new File(['invalid json payload {{{'], 'corrupted.json', { type: 'application/json' });

    fireEvent.change(input, { target: { files: [corruptedFile] } });

    await waitFor(() => {
      expect(errorHandlerSpy).toHaveBeenCalled();
      expect(showToastMock).toHaveBeenCalled();
    });

    errorHandlerSpy.mockRestore();
  });

  it('should toggle API push logging and expand webhook configuration fields', () => {
    const stateWithApiPush: OxyFlowState = {
      ...mockState,
      logToApi: true,
      apiUrl: 'https://api.example.com/logs',
      apiToken: 'token123',
      apiMethod: 'POST',
      apiHeaders: '{"X-Header":"test"}',
    };

    render(
      <MockProviders state={stateWithApiPush}>
        <BackupTab />
      </MockProviders>
    );

    // Expand the API webhook collapsible card
    const header = screen.getByTestId('api-push-collapse-header');
    fireEvent.click(header);

    // Verify inputs are rendered when logToApi is true
    const urlInput = screen.getByTestId('api-url-input');
    const tokenInput = screen.getByTestId('api-token-input');
    const methodSelect = screen.getByRole('combobox');
    const headersTextarea = screen.getByPlaceholderText(/Bearer token/i);

    fireEvent.change(urlInput, { target: { value: 'https://newapi.example.com' } });
    expect(setApiUrlMock).toHaveBeenCalledWith('https://newapi.example.com');

    fireEvent.change(tokenInput, { target: { value: 'newToken456' } });
    expect(setApiTokenMock).toHaveBeenCalledWith('newToken456');

    fireEvent.change(methodSelect, { target: { value: 'PUT' } });
    expect(setApiMethodMock).toHaveBeenCalledWith('PUT');

    fireEvent.change(headersTextarea, { target: { value: '{"X-New":"true"}' } });
    expect(setApiHeadersMock).toHaveBeenCalledWith('{"X-New":"true"}');
  });

  it('should call setLogToApi when API push checkbox is toggled', () => {
    render(
      <MockProviders state={mockState}>
        <BackupTab />
      </MockProviders>
    );

    // Expand the API webhook collapsible card
    const header = screen.getByTestId('api-push-collapse-header');
    fireEvent.click(header);

    const toggle = screen.getByTestId('api-push-toggle');
    fireEvent.click(toggle);

    expect(setLogToApiMock).toHaveBeenCalledWith(true);
  });
});
