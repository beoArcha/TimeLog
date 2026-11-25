// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import AppearanceSettingsCard from '@features/settings/components/AppearanceSettingsCard';
import { MockProviders } from '@tests/shared/mocks/MockProviders';

describe('AppearanceSettingsCard', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should call setTheme when selecting a theme option', () => {
    // Arrange
    const setTheme = vi.fn();

    render(
      <MockProviders settingsState={{ theme: 'dark', setTheme }}>
        <AppearanceSettingsCard />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('settings-theme-light'));

    // Assert
    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('should call setTextAndIconSize when selecting a scale option', () => {
    // Arrange
    const setTextAndIconSize = vi.fn();

    render(
      <MockProviders settingsState={{ textAndIconSize: 'medium', setTextAndIconSize }}>
        <AppearanceSettingsCard />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('settings-text-scale-large'));

    // Assert
    expect(setTextAndIconSize).toHaveBeenCalledWith('large');
  });
});
