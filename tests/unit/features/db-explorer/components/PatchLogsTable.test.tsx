// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PatchLogsTable from '@features/db-explorer/components/PatchLogsTable';
import { OxyContext, OxyFlowState } from '@common/hooks/OxyContext';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: PatchLogsTable', () => {
  const mockState: OxyFlowState = {
    ...getMockOxyFlowState(),
    patches: [
      { id: 'pat_1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z', patchNote: 'Initial Setup schema patch', isSystemEvent: false }
    ],
    locale: 'en',
    customTranslations: {},
  };

  it('should render applied patches table', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <PatchLogsTable />
      </OxyContext.Provider>
    );

    expect(screen.getByText(/pat_1/i)).not.toBeNull();
    expect(screen.getByText(/Initial Setup schema patch/i)).not.toBeNull();
  });
});
