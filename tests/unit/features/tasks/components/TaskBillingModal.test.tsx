// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TaskBillingModal } from '@features/tasks/components/TaskBillingModal';
import { Task } from '@bindings/Task';

describe('Unit Tests: TaskBillingModal', () => {
  afterEach(() => {
    cleanup();
  });

  const baseTask: Task = {
    id: 't-1',
    projectId: 'p-1',
    name: 'Important Feature Task',
    createdAt: new Date().toISOString(),
    completed: false,
    hourlyRate: null,
  };

  it('should default to inherit mode when hourlyRate is null', () => {
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <TaskBillingModal
        open={true}
        onOpenChange={onOpenChange}
        task={baseTask}
        onSaveRate={onSave}
      />
    );

    expect(screen.getByText('Important Feature Task')).toBeTruthy();
    const inheritRadio = screen.getByTestId('rate-mode-inherit');
    expect(inheritRadio.hasAttribute('data-checked') || inheritRadio.getAttribute('aria-checked') === 'true').toBe(true);

    // Confirm save passes null
    const saveBtn = screen.getByTestId('save-task-rate-btn');
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith(null);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should default to non_billable when hourlyRate is "0.00"', () => {
    const onSave = vi.fn();
    render(
      <TaskBillingModal
        open={true}
        onOpenChange={vi.fn()}
        task={{ ...baseTask, hourlyRate: '0.00' }}
        onSaveRate={onSave}
      />
    );

    const nonBillableRadio = screen.getByTestId('rate-mode-non-billable');
    expect(nonBillableRadio.hasAttribute('data-checked') || nonBillableRadio.getAttribute('aria-checked') === 'true').toBe(true);

    const saveBtn = screen.getByTestId('save-task-rate-btn');
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith('0.00');
  });

  it('should default to custom mode when hourlyRate is set to an amount', () => {
    const onSave = vi.fn();
    render(
      <TaskBillingModal
        open={true}
        onOpenChange={vi.fn()}
        task={{ ...baseTask, hourlyRate: '95.00' }}
        onSaveRate={onSave}
      />
    );

    const customRadio = screen.getByTestId('rate-mode-custom');
    expect(customRadio.hasAttribute('data-checked') || customRadio.getAttribute('aria-checked') === 'true').toBe(true);

    const input = screen.getByTestId('task-custom-rate-input') as HTMLInputElement;
    expect(input.value).toBe('95.00');

    // Change custom rate
    fireEvent.change(input, { target: { value: '110.00' } });

    const saveBtn = screen.getByTestId('save-task-rate-btn');
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith('110.00');
  });

  it('should allow switching between modes', () => {
    const onSave = vi.fn();
    render(
      <TaskBillingModal
        open={true}
        onOpenChange={vi.fn()}
        task={baseTask}
        onSaveRate={onSave}
      />
    );

    // Switch to non-billable
    const nonBillableRadio = screen.getByTestId('rate-mode-non-billable');
    fireEvent.click(nonBillableRadio);

    const saveBtn = screen.getByTestId('save-task-rate-btn');
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith('0.00');
  });
});
