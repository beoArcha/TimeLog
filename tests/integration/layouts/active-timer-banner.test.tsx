// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ActiveTimerBanner from '../../../src/layouts/parts/ActiveTimerBanner';
import { GuiState } from '../../../src/layouts/hooks/useGuiLogic';
import { getMockOxyFlowState } from '../../shared/test-helpers';

describe('Integration Tests: ActiveTimerBanner', () => {
  let mockState: ReturnType<typeof getMockOxyFlowState>;

  beforeEach(() => {
    mockState = getMockOxyFlowState();
    mockState.tasks = [
      { id: 'task_1', projectId: 'proj_1', parentTaskId: null, name: 'Active Task', createdAt: '2026-06-12T00:00:00Z', completed: false }
    ];
    mockState.projects = [
      { id: 'proj_1', name: 'Active Project', color: 'rose', createdAt: '2026-06-12T00:00:00Z' }
    ];
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('Given activeLog is null, When rendered, Then it should show idle banner message', () => {
    mockState.activeLog = null;
    const stateProp = {
      ...mockState,
      onStopTimer: mockState.handleStopTimer,
    } as unknown as GuiState;

    render(<ActiveTimerBanner state={stateProp} isCondensed={false} />);

    expect(screen.getByText(/All trackers stopped/i)).toBeTruthy();
  });

  it('Given activeLog exists, When rendered, Then it should show active task/project names and click stop', () => {
    mockState.activeLog = {
      id: 'l1',
      projectId: 'proj_1',
      taskId: 'task_1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: undefined,
      note: undefined,
      editHistory: undefined
    };
    mockState.logs = [mockState.activeLog];
    mockState.nowIso = '2026-06-15T10:05:00Z';

    const stopSpy = vi.fn();
    const stateProp = {
      ...mockState,
      onStopTimer: stopSpy,
    } as unknown as GuiState;

    render(<ActiveTimerBanner state={stateProp} isCondensed={false} />);

    expect(screen.getByText('Active Project')).toBeTruthy();
    expect(screen.getByText('Active Task')).toBeTruthy();
    expect(screen.getByText('00:05:00')).toBeTruthy();

    const stopBtn = screen.getByRole('button');
    fireEvent.click(stopBtn);
    expect(stopSpy).toHaveBeenCalled();
  });
});
