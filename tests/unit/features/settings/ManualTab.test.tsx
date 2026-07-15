// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ManualTab from '@features/settings/ManualTab';
import { OxyContext, OxyFlowState } from '@common/hooks/OxyContext';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: ManualTab', () => {
  const mockState: OxyFlowState = {
    ...getMockOxyFlowState(),
    locale: 'en',
    customTranslations: {},
    resolvedTheme: 'dark',
  };

  it('should render manual tab guidelines', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <ManualTab />
      </OxyContext.Provider>
    );

    expect(screen.getByText(/Compilation Manual/i)).not.toBeNull();
  });
});
