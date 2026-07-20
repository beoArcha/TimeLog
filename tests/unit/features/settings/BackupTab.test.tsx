import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import BackupTab from '@features/settings/BackupTab';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: BackupTab', () => {
  const handleRestoreStateMock = vi.fn();
  const setProjectsMock = vi.fn();
  Object.defineProperty(setProjectsMock, '_isMockFunction', { value: true });

  const mockState: any = {
    ...getMockOxyFlowState(),
    locale: 'en',
    customTranslations: {},
    resolvedTheme: 'dark',
    handleRestoreState: handleRestoreStateMock,
    setProjects: setProjectsMock,
  };

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

  it('should trigger restore state when valid JSON is imported', async () => {
    render(
      <MockProviders state={mockState}>
        <BackupTab />
      </MockProviders>
    );

    const input = screen.getByTestId('import-backup-input') as HTMLInputElement;

    const file = new File(['{"projects":[],"tasks":[],"logs":[],"holidays":[],"patches":[]}'], 'backup.json', { type: 'application/json' });

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(handleRestoreStateMock).toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });
});
