// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HolidaysLeavesTable from '@features/db-explorer/components/HolidaysLeavesTable';
import { OxyContext, OxyFlowState } from '@common/hooks/OxyContext';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: HolidaysLeavesTable', () => {
  const mockState: OxyFlowState = {
    ...getMockOxyFlowState(),
    holidays: [
      { id: 'hol_1', date: '2026-07-20', type: 'holiday', name: 'Summer Holiday' }
    ],
    locale: 'en',
    customTranslations: {},
  };

  it('should render holidays list table', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <HolidaysLeavesTable />
      </OxyContext.Provider>
    );

    expect(screen.getByText(/Summer Holiday/i)).not.toBeNull();
    expect(screen.getByText(/2026-07-20/i)).not.toBeNull();
  });
});
