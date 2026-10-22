// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BackupTab from '@features/settings/BackupTab';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { setupMatchMediaMock, getMockOxyFlowState } from '@tests/shared/test-helpers';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';

describe('Given BackupTab component in settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
    window.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('When user triggers state export', () => {
    it('Then it should trigger JSON blob creation and simulated download link', () => {
      // Given
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      const mockState = getMockOxyFlowState();

      render(
        <MockProviders state={mockState}>
          <BackupTab />
        </MockProviders>
      );

      // When
      const exportBtn = screen.getByTestId('export-backup-btn');
      fireEvent.click(exportBtn);

      // Then
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('When a valid JSON backup file is uploaded', () => {
    it('Then it should parse JSON payload and restore full entity state', async () => {
      // Given
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

      // When
      const input = screen.getByTestId('import-backup-input');
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      // Then
      await waitFor(() => {
        expect(mockState.handleRestoreState).toHaveBeenCalledWith(
          expect.objectContaining({
            projects: expect.arrayContaining([expect.objectContaining({ id: 'p2' })]),
            tasks: expect.arrayContaining([expect.objectContaining({ id: 't2' })]),
            logs: expect.arrayContaining([expect.objectContaining({ id: 'l2' })]),
          })
        );
        expect(mockState.showToast).toHaveBeenCalled();
      });
    });
  });

  describe('When an invalid or malformed JSON file is imported', () => {
    it('Then it should reject import without updating state and notify user', async () => {
      // Given
      const mockState = getMockOxyFlowState();

      render(
        <MockProviders state={mockState}>
          <BackupTab />
        </MockProviders>
      );

      const file = new File(['invalid non-json'], 'corrupted.json', { type: 'application/json' });

      // When
      const input = screen.getByTestId('import-backup-input');
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      // Then
      await waitFor(() => {
        expect(mockState.handleRestoreState).not.toHaveBeenCalled();
        expect(mockState.showToast).toHaveBeenCalled();
      });
    });
  });

  describe('When API push integration section is expanded and toggled', () => {
    it('Then it should update logToApi preference via state coordinator', () => {
      // Given
      const mockState = getMockOxyFlowState();

      render(
        <MockProviders state={mockState}>
          <BackupTab />
        </MockProviders>
      );

      // When
      const expandHeader = screen.getByTestId('api-push-collapse-header');
      fireEvent.click(expandHeader);

      const toggle = screen.getByTestId('api-push-toggle');
      fireEvent.click(toggle);

      // Then
      expect(mockState.setLogToApi).toHaveBeenCalledWith(true);
    });
  });
});
