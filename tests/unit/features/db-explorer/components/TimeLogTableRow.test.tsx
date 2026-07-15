// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import TimeLogTableRow from '@features/db-explorer/components/TimeLogTableRow';

describe('Unit Tests: TimeLogTableRow', () => {
  const testLog = {
    id: 'l1',
    taskId: 't1',
    projectId: 'p1',
    startTime: '2026-06-15T12:00:00Z',
    endTime: '2026-06-15T13:00:00Z',
    note: 'Initial Note',
    editHistory: null
  };

  const onStartEditMock = vi.fn();
  const onSaveEditMock = vi.fn();
  const onCancelEditMock = vi.fn();
  const onDeleteMock = vi.fn();
  const onToggleHistoryMock = vi.fn();

  const mockProps = {
    l: testLog,
    isEditing: false,
    onStartEdit: onStartEditMock,
    onSaveEdit: onSaveEditMock,
    onCancelEdit: onCancelEditMock,
    onDelete: onDeleteMock,
    locale: 'en' as const,
    customTranslations: {},
    showHistory: false,
    onToggleHistory: onToggleHistoryMock,
  };

  afterEach(() => {
    cleanup();
  });

  it('should render log row with note', () => {
    render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} />
        </tbody>
      </table>
    );

    expect(screen.getByText(/Initial Note/i)).not.toBeNull();
  });

  it('should trigger onStartEdit when edit button is clicked', () => {
    const { container } = render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} />
        </tbody>
      </table>
    );

    // The first button is the edit button
    const editBtn = container.querySelector('button');
    expect(editBtn).not.toBeNull();
    fireEvent.click(editBtn!);

    expect(onStartEditMock).toHaveBeenCalled();
  });

  it('should allow note editing and saving when isEditing is true', () => {
    const { container } = render(
      <table>
        <tbody>
          <TimeLogTableRow {...mockProps} isEditing={true} />
        </tbody>
      </table>
    );

    // note input is the 3rd input in the edit row
    const inputs = container.querySelectorAll('input[type="text"]');
    expect(inputs.length).toBeGreaterThanOrEqual(3);
    const noteInput = inputs[2] as HTMLInputElement;

    fireEvent.change(noteInput, { target: { value: 'Updated Note' } });

    // Save button has the text-emerald-450 or text-emerald-400 class, or is the second to last button
    const buttons = container.querySelectorAll('button');
    const saveBtn = Array.from(buttons).find(b => b.className.includes('text-emerald-400'));
    expect(saveBtn).not.toBeUndefined();

    fireEvent.click(saveBtn!);

    // Default reason is "Sync Error / Manual Correction"
    expect(onSaveEditMock).toHaveBeenCalledWith(testLog.startTime, testLog.endTime, 'Updated Note', 'Sync Error / Manual Correction');
  });
});
