// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { StatusIndicator } from '@layouts/components/header-parts/StatusIndicator';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { getMockOXyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: StatusIndicator', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render connecting status when engine is searching in English locale', () => {
    const state = {
      ...getMockOXyFlowState(),
      locale: 'en' as const,
      engineState: 'searching' as const,
    };

    render(
      <MockProviders state={state}>
        <StatusIndicator />
      </MockProviders>
    );

    expect(screen.getByText('CONNECTING')).not.toBeNull();
  });

  it('should render daemon running status when engine is active in Polish locale', () => {
    const state = {
      ...getMockOXyFlowState(),
      locale: 'pl' as const,
      engineState: 'synced' as const,
    };

    render(
      <MockProviders state={state}>
        <StatusIndicator />
      </MockProviders>
    );

    expect(screen.getByText('DAEMON AKTYWNY')).not.toBeNull();
  });

  it('should render localized status connecting when engine is searching in German locale', () => {
    const state = {
      ...getMockOXyFlowState(),
      locale: 'de' as const,
      engineState: 'searching' as const,
    };

    render(
      <MockProviders state={state}>
        <StatusIndicator />
      </MockProviders>
    );

    expect(screen.getByText('VERBINDEN')).not.toBeNull();
  });
});
