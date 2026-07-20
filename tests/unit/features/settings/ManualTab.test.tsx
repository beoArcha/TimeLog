import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ManualTab from '@features/settings/ManualTab';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: ManualTab', () => {
  const mockState: any = {
    ...getMockOxyFlowState(),
    locale: 'en',
    customTranslations: {},
    resolvedTheme: 'dark',
  };

  it('should render manual tab guidelines', () => {
    render(
      <MockProviders state={mockState}>
        <ManualTab />
      </MockProviders>
    );

    expect(screen.getByText(/Compilation Manual/i)).not.toBeNull();
  });
});
