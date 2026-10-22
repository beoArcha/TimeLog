// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DbExplorer from '@features/db-explorer/DbExplorer';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Given DbExplorer developer inspection tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('When DbExplorer mounts with repository state', () => {
    it('Then it should render driver banner and entity tables', () => {
      // Given
      const mockState = getMockOxyFlowState();
      mockState.projects = [aProject({ id: 'proj-1', name: 'Alpha Proj' })];
      mockState.tasks = [aTask({ id: 'task-1', projectId: 'proj-1', name: 'Alpha Task' })];
      mockState.logs = [aTimeLog({ id: 'log-1', projectId: 'proj-1', taskId: 'task-1' })];

      // When
      render(
        <LocaleProvider>
          <MockProviders state={mockState}>
            <DbExplorer />
          </MockProviders>
        </LocaleProvider>
      );

      // Then
      expect(screen.getByRole('button', { name: /export/i })).toBeDefined();
      expect(screen.getByText('Alpha Proj')).toBeDefined();
      expect(screen.getByText('Alpha Task')).toBeDefined();
    });
  });

  describe('When user triggers database export', () => {
    it('Then it should generate backup payload and trigger blob download', () => {
      // Given
      const mockState = getMockOxyFlowState();
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      render(
        <LocaleProvider>
          <MockProviders state={mockState}>
            <DbExplorer />
          </MockProviders>
        </LocaleProvider>
      );

      // When
      const exportBtn = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportBtn);

      // Then
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
