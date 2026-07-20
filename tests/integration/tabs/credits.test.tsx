import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CreditsTab from '@features/settings/CreditsTab';
import { setupMatchMediaMock, getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Integration Tests: CreditsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
  });

  afterEach(() => {
    cleanup();
  });

  it('Given CreditsTab rendered, When resolvedTheme is dark, Then it should show licenses and OSS details', () => {
    const mockState = getMockOxyFlowState();
    mockState.resolvedTheme = 'dark';

    render(
      <MockProviders state={mockState}>
        <CreditsTab />
      </MockProviders>
    );

    expect(screen.getByText('Credits, OSS & Creators')).toBeDefined();
    expect(screen.getByText('React')).toBeDefined();
    expect(screen.getByText('Tauri')).toBeDefined();
  });

  it('Given CreditsTab rendered, When resolvedTheme is light, Then it should use light theme styling classes', () => {
    const mockState = getMockOxyFlowState();
    mockState.resolvedTheme = 'light';

    render(
      <MockProviders state={mockState}>
        <CreditsTab />
      </MockProviders>
    );

    expect(screen.getByText('Credits, OSS & Creators')).toBeDefined();
    const headers = screen.getAllByRole('heading', { level: 2 });
    expect(headers[0].className).toContain('text-slate-900');
  });
});
