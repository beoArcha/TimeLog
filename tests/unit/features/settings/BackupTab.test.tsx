// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import BackupTab from '@features/settings/BackupTab';
import { OxyContext, OxyFlowState } from '@common/hooks/OxyContext';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: BackupTab', () => {
  const handleRestoreStateMock = vi.fn();
  const setProjectsMock = vi.fn();
  // Mark setProjects as spy to trigger internal vitest branch in BackupTab.tsx
  Object.defineProperty(setProjectsMock, '_isMockFunction', { value: true });

  const mockState: OxyFlowState = {
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
      <OxyContext.Provider value={mockState}>
        <BackupTab />
      </OxyContext.Provider>
    );

    expect(screen.getByTestId('export-backup-btn')).not.toBeNull();
    expect(screen.getByTestId('import-backup-btn')).not.toBeNull();
  });

  it('should trigger restore state when valid JSON is imported', async () => {
    render(
      <OxyContext.Provider value={mockState}>
        <BackupTab />
      </OxyContext.Provider>
    );

    const input = screen.getByTestId('import-backup-input') as HTMLInputElement;

    // Simulate file input change
    const file = new File(['{"projects":[],"tasks":[],"logs":[],"holidays":[],"patches":[]}'], 'backup.json', { type: 'application/json' });

    // We mock window.alert to avoid blocking tests
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(handleRestoreStateMock).toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });
});
