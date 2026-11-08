// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import MediumTabBar, { MediumTabId } from '@layouts/parts/MediumTabBar';

describe('Unit Tests: MediumTabBar', () => {
  afterEach(() => {
    cleanup();
  });

  const renderMediumTabBar = (currentTab: MediumTabId = 'tasks') => {
    const onSelectTab = vi.fn();
    const renderResult = render(
      <MediumTabBar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        locale="en"
      />
    );
    return { ...renderResult, onSelectTab };
  };

  it('should render all medium tabs', () => {
    renderMediumTabBar();

    expect(screen.getByTestId('medium-tab-tasks')).not.toBeNull();
    expect(screen.getByTestId('medium-tab-reports')).not.toBeNull();
    expect(screen.getByTestId('medium-tab-settings')).not.toBeNull();
  });

  it('should call onSelectTab when a tab is clicked', () => {
    const { onSelectTab } = renderMediumTabBar();

    fireEvent.click(screen.getByTestId('medium-tab-reports'));
    expect(onSelectTab).toHaveBeenCalledWith('reports');
  });

  it('should use CSS scale tokens and avoid fixed pixel/tailwind scale classes', () => {
    renderMediumTabBar();

    const tabsList = screen.getByRole('tablist');
    expect(tabsList.className).toContain('justify-start');
    expect(tabsList.className).toContain('gap-section');

    const tasksTab = screen.getByTestId('medium-tab-tasks');
    expect(tasksTab.className).toContain('text-[length:var(--text-main)]');
    expect(tasksTab.className).toContain('padding-section');
    expect(tasksTab.className).toContain('rounded-section');
    expect(tasksTab.className).not.toContain('text-xs');
    expect(tasksTab.className).not.toContain('py-1.5');
    expect(tasksTab.className).not.toContain('px-2');

    const icon = tasksTab.querySelector('svg');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('class')).toContain('icon-medium');
    expect(icon?.getAttribute('class')).not.toContain('w-4');
    expect(icon?.getAttribute('class')).not.toContain('h-4');
    expect(icon?.getAttribute('class')).not.toContain('sm:w-5');
    expect(icon?.getAttribute('class')).not.toContain('sm:h-5');

    const label = tasksTab.querySelector('span');
    expect(label).not.toBeNull();
    expect(label?.getAttribute('class')).toContain('text-main');
    expect(label?.getAttribute('class')).not.toContain('text-xs');
  });
});
