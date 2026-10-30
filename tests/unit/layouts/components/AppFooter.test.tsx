// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import AppFooter from '@layouts/components/AppFooter';

describe('Unit Tests: AppFooter', () => {
  const onNavigateToSettingsMock = vi.fn();
  const setShowCreditsModalMock = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders safe settings navigation button without direct reset trigger in English', () => {
    render(
      <AppFooter
        locale="en"
        onNavigateToSettings={onNavigateToSettingsMock}
        setShowCreditsModal={setShowCreditsModalMock}
      />
    );

    const safeNavBtn = screen.getByRole('button', { name: /Database Management/i });
    expect(safeNavBtn).not.toBeNull();

    fireEvent.click(safeNavBtn);
    expect(onNavigateToSettingsMock).toHaveBeenCalledTimes(1);
  });

  it('renders localized safe navigation button in Polish', () => {
    render(
      <AppFooter
        locale="pl"
        onNavigateToSettings={onNavigateToSettingsMock}
        setShowCreditsModal={setShowCreditsModalMock}
      />
    );

    const safeNavBtn = screen.getByRole('button', { name: /Zarządzaj bazą w Ustawieniach/i });
    expect(safeNavBtn).not.toBeNull();

    fireEvent.click(safeNavBtn);
    expect(onNavigateToSettingsMock).toHaveBeenCalledTimes(1);
  });
});
