// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ActiveTimerBanner from '@layouts/parts/ActiveTimerBanner';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';

describe('Given ActiveTimerBanner component', () => {
  let mockState: ReturnType<typeof getMockOxyFlowState>;

  beforeEach(() => {
    mockState = getMockOxyFlowState();
    const task = aTask({ id: 'task_1', projectId: 'proj_1', parentTaskId: null, name: 'Active Task', completed: false });
    const project = aProject({ id: 'proj_1', name: 'Active Project', color: 'rose' });
    mockState.tasks = [task];
    mockState.projects = [project];
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    vi.restoreAllMocks();
  });

  describe('When activeLog is null', () => {
    it('Then it should display the idle banner status', () => {
      // Given
      mockState.activeLog = null;
      mockState.logs = [];
      const stateProp = {
        ...mockState,
        onStopTimer: mockState.handleStopTimer,
      } as unknown as GuiState;

      // When
      render(<ActiveTimerBanner state={stateProp} isCondensed={false} />);

      // Then
      expect(screen.getByText(/All trackers stopped/i)).toBeTruthy();
    });

    it('Then it should display the last tracked task and resume button when a completed log exists', () => {
      // Given
      const startSpy = vi.fn();
      const pastLog = aTimeLog({
        id: 'l_old',
        projectId: 'proj_1',
        taskId: 'task_1',
        startTime: '2026-06-15T09:00:00Z',
        endTime: '2026-06-15T09:30:00Z',
      });
      mockState.activeLog = null;
      mockState.logs = [pastLog];
      const stateProp = {
        ...mockState,
        onStartTimer: startSpy,
        onStopTimer: mockState.handleStopTimer,
      } as unknown as GuiState;

      // When
      const { container } = render(<ActiveTimerBanner state={stateProp} isCondensed={false} />);

      // Then
      expect(screen.getByText('Active Task')).toBeTruthy();
      const resumeBtn = container.querySelector('#resume-timer-btn');
      expect(resumeBtn).not.toBeNull();
      fireEvent.click(resumeBtn!);
      expect(startSpy).toHaveBeenCalledWith('task_1');
    });
  });

  describe('When an active timer is running', () => {
    it('Then it should display active project, task names, elapsed counter and stop trigger', () => {
      // Given
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-15T10:05:00Z'));

      const activeLog = aTimeLog({
        id: 'l1',
        projectId: 'proj_1',
        taskId: 'task_1',
        startTime: '2026-06-15T10:00:00Z',
        endTime: null,
      });
      mockState.activeLog = activeLog;
      mockState.logs = [activeLog];
      mockState.nowIso = '2026-06-15T10:05:00Z';

      const stopSpy = vi.fn();
      const stateProp = {
        ...mockState,
        onStopTimer: stopSpy,
      } as unknown as GuiState;

      // When
      render(<ActiveTimerBanner state={stateProp} isCondensed={false} />);

      // Then
      expect(screen.getByText('Active Project')).toBeTruthy();
      expect(screen.getByText('Active Task')).toBeTruthy();
      expect(screen.getByText('00:05:00')).toBeTruthy();

      const stopBtn = screen.getByRole('button');
      fireEvent.click(stopBtn);
      expect(stopSpy).toHaveBeenCalled();
    });
  });
});
