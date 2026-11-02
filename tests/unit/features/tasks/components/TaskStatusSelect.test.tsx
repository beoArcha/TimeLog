import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TaskStatusSelect } from '@features/tasks/components/TaskStatusSelect';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: TaskStatusSelect', () => {
  afterEach(() => {
    cleanup();
  });
  const defaultState = {
    ...getMockOxyFlowState(),
    locale: 'en' as const,
    customTranslations: {},
    resolvedTheme: 'dark' as const,
  };

  it('renders InProgress status with semantic default badge variant (bg-primary)', () => {
    const onStatusChange = vi.fn();
    render(
      <MockProviders state={defaultState}>
        <TaskStatusSelect status="InProgress" onStatusChange={onStatusChange} />
      </MockProviders>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDefined();
    // InProgress uses badgeVariants({ variant: 'default' }) which includes bg-primary
    expect(trigger.className).toContain('bg-primary');
    expect(trigger.className).toContain('text-primary-foreground');
  });

  it('renders Done status with semantic success badge variant', () => {
    const onStatusChange = vi.fn();
    render(
      <MockProviders state={defaultState}>
        <TaskStatusSelect status="Done" onStatusChange={onStatusChange} />
      </MockProviders>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger.className).toContain('bg-emerald-500/10');
    expect(trigger.className).toContain('text-emerald-600');
  });

  it('renders Blocked status with semantic destructive badge variant', () => {
    const onStatusChange = vi.fn();
    render(
      <MockProviders state={defaultState}>
        <TaskStatusSelect status="Blocked" onStatusChange={onStatusChange} />
      </MockProviders>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger.className).toContain('bg-destructive');
    expect(trigger.className).toContain('text-destructive-foreground');
  });

  it('renders Todo status with semantic secondary badge variant', () => {
    const onStatusChange = vi.fn();
    render(
      <MockProviders state={defaultState}>
        <TaskStatusSelect status="Todo" onStatusChange={onStatusChange} />
      </MockProviders>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger.className).toContain('bg-secondary');
    expect(trigger.className).toContain('text-secondary-foreground');
  });
});
