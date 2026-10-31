import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import ManualTab from '@features/settings/ManualTab';
import { getMockOxyFlowState, OxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: ManualTab', () => {
  afterEach(() => {
    cleanup();
  });

  const mockState: OxyFlowState = {
    ...getMockOxyFlowState(),
    locale: 'en',
    customTranslations: {},
    resolvedTheme: 'dark',
  };

  it('renders CompilationGuideCard and KeyboardShortcutsCard with CLI shortcut in desktop mode (hasNativeDaemon: true, canUseCli: true)', () => {
    render(
      <MockProviders state={mockState} capabilitiesState={{ hasNativeDaemon: true, canUseCli: true }}>
        <ManualTab />
      </MockProviders>
    );

    expect(screen.getByText(/Building the App Installer/i)).not.toBeNull();
    const shortcutsHeader = screen.getByText(/Keyboard Shortcuts/i);
    expect(shortcutsHeader).not.toBeNull();
    fireEvent.click(shortcutsHeader);
    expect(screen.getByText(/oxy timer start/i)).not.toBeNull();
  });

  it('hides CompilationGuideCard and CLI shortcut in PWA mode (hasNativeDaemon: false, canUseCli: false)', () => {
    render(
      <MockProviders state={mockState} capabilitiesState={{ hasNativeDaemon: false, canUseCli: false }}>
        <ManualTab />
      </MockProviders>
    );

    expect(screen.queryByText(/Building the App Installer/i)).toBeNull();
    const shortcutsHeader = screen.getByText(/Keyboard Shortcuts/i);
    expect(shortcutsHeader).not.toBeNull();
    fireEvent.click(shortcutsHeader);
    expect(screen.queryByText(/oxy timer start/i)).toBeNull();
  });
});
