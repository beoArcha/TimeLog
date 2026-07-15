// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HolidaysLeavesView from '@features/holidays/HolidaysLeavesView';
import { OxyContext, OxyFlowState } from '@common/hooks/OxyContext';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: HolidaysLeavesView', () => {
  const handleAddHolidayMock = vi.fn();
  const handleDeleteHolidayMock = vi.fn();

  const mockState: OxyFlowState = {
    ...getMockOxyFlowState(),
    holidays: [
      { id: 'hol_1', date: '2026-07-20', type: 'holiday', name: 'Summer Holiday' }
    ],
    locale: 'en',
    customTranslations: {},
    handleAddHoliday: handleAddHolidayMock,
    handleDeleteHoliday: handleDeleteHolidayMock
  };

  it('should render holidays view and list existing ones', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <HolidaysLeavesView />
      </OxyContext.Provider>
    );

    expect(screen.getByText(/Summer Holiday/i)).not.toBeNull();
  });

  it('should trigger handleAddHoliday on form submit', () => {
    const { container } = render(
      <OxyContext.Provider value={mockState}>
        <HolidaysLeavesView />
      </OxyContext.Provider>
    );

    const descInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(descInput).not.toBeNull();
    fireEvent.change(descInput, { target: { value: 'New Test Holiday' } });

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).not.toBeNull();
    fireEvent.click(submitBtn);

    expect(handleAddHolidayMock).toHaveBeenCalledWith('2026-06-15', 'leave', 'New Test Holiday');
  });

  it('should trigger handleDeleteHoliday when delete is clicked', () => {
    const { container } = render(
      <OxyContext.Provider value={mockState}>
        <HolidaysLeavesView />
      </OxyContext.Provider>
    );

    const deleteBtn = container.querySelector('.lucide-trash2')?.closest('button');
    expect(deleteBtn).not.toBeNull();
    fireEvent.click(deleteBtn!);

    expect(handleDeleteHolidayMock).toHaveBeenCalledWith('hol_1');
  });
});
