// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import AddLogForm from '@features/db-explorer/components/AddLogForm';

describe('Unit Tests: AddLogForm', () => {
  const onSubmitMock = vi.fn();
  const onCancelMock = vi.fn();

  const mockProps = {
    projects: [
      { id: 'p1', name: 'Proj 1', color: 'red', createdAt: '2026', archived: false, description: null, icon: null, tags: null }
    ],
    tasks: [
      { id: 't1', projectId: 'p1', name: 'Task 1', completed: false, createdAt: '2026', status: null, parentTaskId: null }
    ],
    locale: 'en' as const,
    customTranslations: {},
    onSubmit: onSubmitMock,
    onCancel: onCancelMock
  };

  afterEach(() => {
    cleanup();
  });

  it('should render the log form input fields', () => {
    render(<AddLogForm {...mockProps} />);
    expect(screen.getByText(/Assign to task/i)).not.toBeNull();
    expect(screen.getByText(/Start \(startTime\):/i)).not.toBeNull();
  });

  it('should trigger onSubmit on submit button click', () => {
    const { container } = render(<AddLogForm {...mockProps} />);

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).not.toBeNull();
    fireEvent.click(submitBtn);

    expect(onSubmitMock).toHaveBeenCalled();
  });
});
