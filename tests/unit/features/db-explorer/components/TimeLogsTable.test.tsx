import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TimeLogsTable from '@features/db-explorer/components/TimeLogsTable';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

// Mock table row using the exact path relative to the test file
vi.mock('@features/db-explorer/components/TimeLogTableRow', () => ({
  default: ({ l }: any) => <tr data-testid={`mock-row-${l.id}`}><td>Row {l.id}</td></tr>
}));

describe('Unit Tests: TimeLogsTable', () => {
  const mockState: any = {
    ...getMockOxyFlowState(),
    logs: [
      { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z', note: 'Session 1', editHistory: null }
    ],
    locale: 'en',
    customTranslations: {},
  };

  it('should render timelogs table and rows', () => {
    render(
      <MockProviders state={mockState}>
        <TimeLogsTable />
      </MockProviders>
    );

    expect(screen.getByTestId('mock-row-l1')).not.toBeNull();
  });
});
