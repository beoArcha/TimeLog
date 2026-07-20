import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import DbExplorer from '@features/db-explorer/DbExplorer';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

vi.mock('@features/db-explorer/components/ProjectsTable', () => ({
  default: () => <div data-testid="mock-projects-table">ProjectsTable</div>
}));
vi.mock('@features/db-explorer/components/TasksTable', () => ({
  default: () => <div data-testid="mock-tasks-table">TasksTable</div>
}));
vi.mock('@features/db-explorer/components/TimeLogsTable', () => ({
  default: () => <div data-testid="mock-timelogs-table">TimeLogsTable</div>
}));
vi.mock('@features/db-explorer/components/HolidaysLeavesTable', () => ({
  default: () => <div data-testid="mock-holidays-table">HolidaysLeavesTable</div>
}));
vi.mock('@features/db-explorer/components/PatchLogsTable', () => ({
  default: () => <div data-testid="mock-patches-table">PatchLogsTable</div>
}));

describe('Unit Tests: DbExplorer', () => {
  const mockState: any = {
    ...getMockOxyFlowState(),
    projects: [
      { id: 'p1', name: 'Proj A', color: 'indigo', createdAt: '2026-06-15', archived: false, description: null, icon: null, tags: null }
    ],
    locale: 'en',
    customTranslations: {},
    isLoading: false
  } as unknown as any;

  afterEach(() => {
    cleanup();
  });

  it('should render all mocked table components when loaded', () => {
    render(
      <MockProviders state={mockState}>
        <DbExplorer />
      </MockProviders>
    );

    expect(screen.getByTestId('mock-projects-table')).not.toBeNull();
    expect(screen.getByTestId('mock-tasks-table')).not.toBeNull();
    expect(screen.getByTestId('mock-timelogs-table')).not.toBeNull();
    expect(screen.getByTestId('mock-holidays-table')).not.toBeNull();
    expect(screen.getByTestId('mock-patches-table')).not.toBeNull();
  });

  it('should render table skeletons when isLoading is true', () => {
    const loadingState = { ...mockState, isLoading: true };
    render(
      <MockProviders state={loadingState}>
        <DbExplorer />
      </MockProviders>
    );

    expect(screen.queryByTestId('mock-projects-table')).toBeNull();
  });

  it('should trigger database download when export is clicked', () => {
    // Mock global URL functions
    const createObjectURLMock = vi.fn(() => 'mock-blob-url');
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    render(
      <MockProviders state={mockState}>
        <DbExplorer />
      </MockProviders>
    );

    const exportBtn = screen.getByTestId('export-db-btn');
    fireEvent.click(exportBtn);

    expect(createObjectURLMock).toHaveBeenCalled();
  });
});
