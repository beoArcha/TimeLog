import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
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

  it('renders CompilationGuideCard and KeyboardShortcutsCard in desktop mode (hasNativeDaemon: true)', () => {
    render(
      <MockProviders state={mockState} capabilitiesState={{ hasNativeDaemon: true }}>
        <ManualTab />
      </MockProviders>
    );

    expect(screen.getByText(/Building the App Installer/i)).not.toBeNull();
    expect(screen.getByText(/Keyboard Shortcuts/i)).not.toBeNull();
  });

  it('hides CompilationGuideCard and keeps KeyboardShortcutsCard visible in PWA mode (hasNativeDaemon: false)', () => {
    render(
      <MockProviders state={mockState} capabilitiesState={{ hasNativeDaemon: false }}>
        <ManualTab />
      </MockProviders>
    );

    expect(screen.queryByText(/Building the App Installer/i)).toBeNull();
    expect(screen.getByText(/Keyboard Shortcuts/i)).not.toBeNull();
  });
});
