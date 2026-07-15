// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import CreditsTab from '@features/settings/CreditsTab';
import { OxyContext } from '@common/hooks/OxyContext';
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
      <OxyContext.Provider value={mockState}>
        <CreditsTab />
      </OxyContext.Provider>
    );

    expect(screen.getByText(/Mozilla Public License/i)).not.toBeNull();
    expect(screen.getByText(/Open Source Technologies/i)).not.toBeNull();
  });
});
