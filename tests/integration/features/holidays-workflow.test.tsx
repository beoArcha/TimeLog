// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import HolidaysLeavesView from '@features/holidays/HolidaysLeavesView';
import { aHolidayLeave } from '@tests/shared/builders/entity-builders';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { getMockOxyFlowState, setupMatchMediaMock } from '@tests/shared/test-helpers';

describe('Given HolidaysLeavesView registration and management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('When user fills and submits the day-off registration form', () => {
    it('Then it should invoke handleAddHoliday on DataContext coordinator', () => {
      // Given
      const mockState = getMockOxyFlowState();

      render(
        <MockProviders state={mockState}>
          <HolidaysLeavesView />
        </MockProviders>
      );

      // When
      const textInputs = screen.getAllByRole('textbox');
      fireEvent.change(textInputs[0], { target: { value: 'Annual Summer Vacation' } });

      const submitBtn = screen.getByRole('button', { name: /save/i });
      fireEvent.click(submitBtn);

      // Then
      expect(mockState.handleAddHoliday).toHaveBeenCalledWith(
        '2026-06-15',
        'leave',
        'Annual Summer Vacation'
      );
    });
  });

  describe('When HolidaysLeavesView renders with registered holidays', () => {
    it('Then it renders the holiday entries in the table list', () => {
      // Given
      const mockState = getMockOxyFlowState();
      mockState.holidays = [
        aHolidayLeave({
          id: 'h1',
          date: '2026-12-25',
          type: 'holiday',
          name: 'Christmas Holiday',
        }),
      ];

      // When
      render(
        <MockProviders state={mockState}>
          <HolidaysLeavesView />
        </MockProviders>
      );

      // Then
      expect(screen.getByText('Christmas Holiday')).toBeDefined();
    });
  });
});
