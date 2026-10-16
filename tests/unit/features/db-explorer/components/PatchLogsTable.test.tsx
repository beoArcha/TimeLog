// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import PatchLogsTable from '@features/db-explorer/components/PatchLogsTable';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aPatchLog, aProject } from '@tests/shared/builders/entity-builders';
import { getMockOxyFlowState, OxyFlowState } from '@tests/shared/test-helpers';
import { PatchLog } from '@bindings/PatchLog';

describe('Unit Tests: PatchLogsTable', () => {
  afterEach(() => {
    cleanup();
  });

  const createMockState = (patches: PatchLog[]): OxyFlowState => ({
    ...getMockOxyFlowState(),
    projects: [aProject({ id: 'p1', name: 'Project Alpha' })],
    patches,
    locale: 'en',
    customTranslations: {},
  });

  it('should render applied patches table with standard patch data', () => {
    // Arrange
    const patch = aPatchLog({
      id: 'pat_1',
      projectId: 'p1',
      patchNote: 'Initial Setup schema patch',
      isSystemEvent: false,
    });
    const state = createMockState([patch]);

    // Act
    render(
      <MockProviders state={state}>
        <PatchLogsTable />
      </MockProviders>
    );

    // Assert
    expect(screen.getByText('pat_1')).toBeTruthy();
    expect(screen.getByText(/Initial Setup schema patch/)).toBeTruthy();
    expect(screen.queryByText('[SYSTEM]')).toBeNull();
  });

  it('should display [SYSTEM] indicator badge when patch is marked as system event', () => {
    // Arrange
    const systemPatch = aPatchLog({
      id: 'pat_sys_1',
      projectId: 'p1',
      patchNote: 'Auto sleep compensation',
      isSystemEvent: true,
    });
    const state = createMockState([systemPatch]);

    // Act
    render(
      <MockProviders state={state}>
        <PatchLogsTable />
      </MockProviders>
    );

    // Assert
    expect(screen.getByText('pat_sys_1')).toBeTruthy();
    expect(screen.getByText(/Auto sleep compensation/)).toBeTruthy();
    expect(screen.getByText('[SYSTEM]')).toBeTruthy();
  });

  it('should render empty state message row when patches list is empty', () => {
    // Arrange
    const state = createMockState([]);

    // Act
    const { container } = render(
      <MockProviders state={state}>
        <PatchLogsTable />
      </MockProviders>
    );

    // Assert
    expect(screen.getByText('id')).toBeTruthy();
    expect(screen.getByText('project_id')).toBeTruthy();
    const emptyCell = container.querySelector('tbody td[colspan="7"]');
    expect(emptyCell).not.toBeNull();
    expect(emptyCell?.textContent).toContain('patch_logs');
  });
});
