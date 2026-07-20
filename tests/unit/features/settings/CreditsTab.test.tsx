import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import CreditsTab from '@features/settings/CreditsTab';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: CreditsTab', () => {
  const mockState = {
    ...getMockOxyFlowState(),
    locale: 'en' as const,
    customTranslations: {},
    resolvedTheme: 'dark',
  };

  afterEach(() => {
    cleanup();
  });

  it('should render credits and technology tags', () => {
    render(
      <MockProviders state={mockState}>
        <CreditsTab />
      </MockProviders>
    );

    expect(screen.getByText(/Mozilla Public License/i)).not.toBeNull();
    expect(screen.getByText(/Open Source Technologies/i)).not.toBeNull();
  });
});
