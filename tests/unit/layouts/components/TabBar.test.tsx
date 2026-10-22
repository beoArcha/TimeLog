// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import TabBar from '@layouts/components/TabBar';
import { PlatformCapabilitiesContext } from '@common/contexts/PlatformCapabilitiesContext';

describe('TabBar', () => {
  afterEach(() => {
    cleanup();
  });
  it('should omit the db tab when canInspectDatabase is false', () => {
    // Arrange
    const setActiveLargeTab = vi.fn();

    // Act
    render(
      <PlatformCapabilitiesContext.Provider
        value={{ dragRegionProps: {}, canInspectDatabase: false }}
      >
        <TabBar
          locale="en"
          activeLargeTab="tasks"
          setActiveLargeTab={setActiveLargeTab}
        />
      </PlatformCapabilitiesContext.Provider>
    );

    // Assert
    expect(screen.queryByTestId('tab-db')).toBeNull();
    expect(screen.getByTestId('tab-tasks')).not.toBeNull();
    expect(screen.getByTestId('tab-cli')).not.toBeNull();
  });

  it('should include the db tab when canInspectDatabase is true', () => {
    // Arrange
    const setActiveLargeTab = vi.fn();

    // Act
    render(
      <PlatformCapabilitiesContext.Provider
        value={{ dragRegionProps: {}, canInspectDatabase: true }}
      >
        <TabBar
          locale="en"
          activeLargeTab="tasks"
          setActiveLargeTab={setActiveLargeTab}
        />
      </PlatformCapabilitiesContext.Provider>
    );

    // Assert
    expect(screen.getByTestId('tab-db')).not.toBeNull();
    expect(screen.getByTestId('tab-tasks')).not.toBeNull();
  });
});
