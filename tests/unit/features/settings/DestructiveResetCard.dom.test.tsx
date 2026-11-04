// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DestructiveResetCard from '@features/settings/components/DestructiveResetCard';
import { getMockOXyFlowState, OXyFlowState } from '@tests/shared/test-helpers';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { expectNoFlowContent } from '@tests/shared/html-content-model';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('DestructiveResetCard DOM content model', () => {
  let mockState: OXyFlowState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      ...getMockOXyFlowState(),
      locale: 'en',
      customTranslations: {},
      handleResetLocalStorage: vi.fn(),
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('binds accessible name via aria-labelledby and description via aria-describedby with unique ids', () => {
    render(
      <MockProviders state={mockState} capabilitiesState={{ supportsTray: false }}>
        <DestructiveResetCard />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('destructive-zone-card'));
    fireEvent.click(screen.getByTestId('hard-reset-btn'));

    const scopes = [
      {
        testId: 'reset-scope-all',
        labelId: 'reset-scope-all-label',
        descId: 'reset-scope-all-desc',
        expectedName: 'Select All',
        expectedDesc: 'Erase all domains completely',
      },
      {
        testId: 'reset-scope-business',
        labelId: 'reset-scope-business-label',
        descId: 'reset-scope-business-desc',
        expectedName: 'Business Data',
        expectedDesc: 'Projects, tasks, recorded time logs, and holidays',
      },
      {
        testId: 'reset-scope-settings',
        labelId: 'reset-scope-settings-label',
        descId: 'reset-scope-settings-desc',
        expectedName: 'User Settings',
        expectedDesc: 'Theme, layouts, custom translations, and UI preferences',
      },
      {
        testId: 'reset-scope-system',
        labelId: 'reset-scope-system-label',
        descId: 'reset-scope-system-desc',
        expectedName: 'System & Runtime',
        expectedDesc: 'Runtime configs, webhook queue, and API credentials',
      },
    ];

    for (const scope of scopes) {
      const checkbox = screen.getByTestId(scope.testId) as HTMLInputElement;
      expect(checkbox.getAttribute('aria-labelledby')).toBe(scope.labelId);
      expect(checkbox.getAttribute('aria-describedby')).toBe(scope.descId);

      const labelEl = screen.getByText(scope.expectedName);
      const descEl = screen.getByText(scope.expectedDesc);
      expect(labelEl.id).toBe(scope.labelId);
      expect(descEl.id).toBe(scope.descId);

      // Accessible name must be strictly the title, avoiding accidental concatenation with description
      const accessibleCheckbox = screen.getByRole('checkbox', { name: scope.expectedName });
      expect(accessibleCheckbox).toBe(checkbox);
    }
  });

  it('ensures all checkbox label wrappers strictly contain only phrasing content in rendered DOM', () => {
    render(
      <MockProviders state={mockState} capabilitiesState={{ supportsTray: false }}>
        <DestructiveResetCard />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('destructive-zone-card'));
    fireEvent.click(screen.getByTestId('hard-reset-btn'));

    const labels = document.querySelectorAll('label');
    expect(labels.length).toBeGreaterThan(0);

    labels.forEach((label) => {
      expectNoFlowContent(label);
    });
  });
});
