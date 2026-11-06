// @vitest-environment jsdom
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useReportStatistics } from '@features/reports/hooks/useReportStatistics';
import { EngineRouter } from '@common/engine/EngineRouter';
import { RangeBillingResult } from '@common/engine/billing/types';
import { TimeLog } from '@bindings/TimeLog';
import { PatchLog } from '@bindings/PatchLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';

describe('Unit Tests: useReportStatistics', () => {
  const mockBillingResult: RangeBillingResult = {
    byCurrency: {
      USD: {
        currency: 'USD',
        totalAmount: '100.00',
        billableDurationSeconds: 3600,
        nonBillableDurationSeconds: 0,
        unconfiguredDurationSeconds: 0,
      },
    },
    byTask: [
      {
        taskId: 't1',
        taskName: 'Task One',
        projectId: 'p1',
        durationSeconds: 3600,
        effectiveRate: '100.00',
        currency: 'USD',
        rateStatus: 'custom',
        amount: '100.00',
      },
    ],
    totalBillableSeconds: 3600,
    totalNonBillableSeconds: 0,
    totalUnconfiguredSeconds: 0,
  };

  let calculateRangeBillingMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    calculateRangeBillingMock = vi.fn().mockResolvedValue(mockBillingResult);
    vi.spyOn(EngineRouter, 'getInstance').mockReturnValue({
      billing: {
        calculateRangeBilling: calculateRangeBillingMock,
        resolveEffectiveTaskRate: vi.fn(),
      },
    } as unknown as EngineRouter);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const projects: Project[] = [
    { id: 'p1', name: 'Project Alpha', color: 'rose', createdAt: '2026-06-12T00:00:00Z' },
    { id: 'p2', name: 'Project Beta', color: 'blue', createdAt: '2026-06-12T00:00:00Z' }
  ];

  const tasks: Task[] = [
    { id: 't1', projectId: 'p1', parentTaskId: null, name: 'Task One', createdAt: '2026-06-12T00:00:00Z', completed: false },
    { id: 't2', projectId: 'p2', parentTaskId: null, name: 'Task Two', createdAt: '2026-06-12T00:00:00Z', completed: false }
  ];

  const logs: TimeLog[] = [
    {
      id: 'l1',
      projectId: 'p1',
      taskId: 't1',
      startTime: '2026-07-12T10:00:00Z',
      endTime: '2026-07-12T11:00:00Z', // 3600 seconds
      note: 'Log 1',
      editHistory: undefined
    },
    {
      id: 'l2',
      projectId: 'p2',
      taskId: 't2',
      startTime: '2026-07-11T12:00:00Z',
      endTime: '2026-07-11T14:00:00Z', // 7200 seconds
      note: 'Log 2',
      editHistory: undefined
    }
  ];

  const patches: PatchLog[] = [
    {
      id: 'pt1',
      projectId: 'p1',
      taskId: 't1',
      startTime: '2026-07-12T09:00:00Z',
      endTime: '2026-07-12T09:30:00Z', // 1800 seconds
      patchNote: 'Patch 1'
    }
  ];

  it('should calculate today, week, and month statistics correctly without patches', async () => {
    const { result } = renderHook(() =>
      useReportStatistics({
        logs,
        patches,
        projects,
        tasks,
        nowIso: '2026-07-12T15:00:00Z',
        reportPeriod: 'week',
        reportSort: 'duration',
        sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] }
      })
    );

    expect(result.current.todaySec).toBe(3600); // l1 is today (2026-07-12)
    expect(result.current.weekSec).toBe(10800); // both l1 and l2 are within this week
    expect(result.current.monthSec).toBe(10800);
    expect(result.current.filteredLogs).toHaveLength(2);
    expect(result.current.projectChart).toHaveLength(2);
    expect(result.current.projectChart[0].id).toBe('p2'); // sorted by duration: p2 has 7200, p1 has 3600
    expect(result.current.projectChart[0].seconds).toBe(7200);

    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });
    expect(result.current.billingResult).toEqual(mockBillingResult);
    expect(result.current.billingError).toBeNull();
  });

  it('should include patches in reports if sysSettings.includePatchesInReports is true', async () => {
    const { result } = renderHook(() =>
      useReportStatistics({
        logs,
        patches,
        projects,
        tasks,
        nowIso: '2026-07-12T15:00:00Z',
        reportPeriod: 'week',
        reportSort: 'duration',
        sysSettings: { includePatchesInReports: true, autoStart: false, activeSinks: [] }
      })
    );

    expect(result.current.todaySec).toBe(3600 + 1800); // l1 (3600) + pt1 (1800)
    expect(result.current.weekSec).toBe(10800 + 1800);
    expect(result.current.monthSec).toBe(10800 + 1800);

    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });
  });

  it('should filter logs by reportPeriod today correctly', async () => {
    const { result } = renderHook(() =>
      useReportStatistics({
        logs,
        patches,
        projects,
        tasks,
        nowIso: '2026-07-12T15:00:00Z',
        reportPeriod: 'today',
        reportSort: 'duration',
        sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] }
      })
    );

    expect(result.current.filteredLogs).toHaveLength(1);
    expect(result.current.filteredLogs[0].id).toBe('l1');

    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });
  });

  it('should filter logs by reportPeriod month and all, and sort alfabetic/date correctly', async () => {
    const { result } = renderHook(() =>
      useReportStatistics({
        logs,
        patches,
        projects,
        tasks,
        nowIso: '2026-07-12T15:00:00Z',
        reportPeriod: 'month',
        reportSort: 'date',
        sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] }
      })
    );

    expect(result.current.filteredLogs).toHaveLength(2);
    expect(result.current.displayLogs[0].id).toBe('l2');
    expect(result.current.displayLogs[1].id).toBe('l1');

    expect(result.current.projectChart[0].id).toBe('p1');
    expect(result.current.projectChart[1].id).toBe('p2');

    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });
  });

  it('should filter logs by reportPeriod all correctly', async () => {
    const { result } = renderHook(() =>
      useReportStatistics({
        logs,
        patches,
        projects,
        tasks,
        nowIso: '2026-07-12T15:00:00Z',
        reportPeriod: 'all',
        reportSort: 'duration',
        sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] }
      })
    );

    expect(result.current.filteredLogs).toHaveLength(2);

    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });
  });

  it('should handle billing calculation failure gracefully', async () => {
    calculateRangeBillingMock.mockRejectedValueOnce(new Error('Calculation failed'));

    const { result } = renderHook(() =>
      useReportStatistics({
        logs,
        patches,
        projects,
        tasks,
        nowIso: '2026-07-12T15:00:00Z',
        reportPeriod: 'week',
        reportSort: 'duration',
        sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
      })
    );

    await waitFor(() => {
      expect(result.current.billingError).toBe('Calculation failed');
    });

    expect(result.current.isBillingLoading).toBe(false);
    expect(result.current.billingResult).toBeNull();
  });

  it('should pass selectedProjectId to billing calculation filter when provided', async () => {
    const { result } = renderHook(() =>
      useReportStatistics({
        logs,
        patches,
        projects,
        tasks,
        nowIso: '2026-07-12T15:00:00Z',
        reportPeriod: 'week',
        reportSort: 'duration',
        selectedProjectId: 'p1',
        sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
      })
    );

    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });

    expect(calculateRangeBillingMock).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'p1' }),
      '2026-07-12T15:00:00Z'
    );
  });

  it('should handle EngineRouter instantiation failure gracefully', async () => {
    vi.spyOn(EngineRouter, 'getInstance').mockImplementation(() => {
      throw new Error('EngineRouter unavailable');
    });

    const { result } = renderHook(() =>
      useReportStatistics({
        logs,
        patches,
        projects,
        tasks,
        nowIso: '2026-07-12T15:00:00Z',
        reportPeriod: 'week',
        reportSort: 'duration',
        sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
      })
    );

    await waitFor(() => {
      expect(result.current.billingError).toBe('EngineRouter unavailable');
    });

    expect(result.current.isBillingLoading).toBe(false);
    expect(result.current.billingResult).toBeNull();
  });
});
