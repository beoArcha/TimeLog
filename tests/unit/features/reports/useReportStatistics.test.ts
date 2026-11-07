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

  it('should handle billing calculation failure gracefully and sanitize error message', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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
      // User-facing error message must be translated/sanitized, not raw Error message
      expect(result.current.billingError).toBe('Failed to calculate range billing');
    });

    expect(result.current.isBillingLoading).toBe(false);
    expect(result.current.billingResult).toBeNull();

    // Detailed error must be logged to console.error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[useReportStatistics] Billing calculation failed:'),
      expect.objectContaining({ error: expect.any(Error) })
    );
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

  it('should handle EngineRouter instantiation failure gracefully and log to console', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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
      expect(result.current.billingError).toBe('Failed to calculate range billing');
    });

    expect(result.current.isBillingLoading).toBe(false);
    expect(result.current.billingResult).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[useReportStatistics] Failed to get EngineRouter instance:'),
      expect.objectContaining({ error: expect.any(Error) })
    );
  });

  it('should reset billingResult to null and set isBillingLoading to true when reportPeriod or selectedProjectId changes', async () => {
    let resolveBillingPromise: ((val: RangeBillingResult) => void) | undefined;
    calculateRangeBillingMock.mockImplementation(
      () =>
        new Promise<RangeBillingResult>((resolve) => {
          resolveBillingPromise = resolve;
        })
    );

    const initialProps = {
      logs,
      patches,
      projects,
      tasks,
      nowIso: '2026-07-12T15:00:00Z',
      reportPeriod: 'week',
      reportSort: 'duration',
      selectedProjectId: 'p1',
      sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
    };

    const { result, rerender } = renderHook((props) => useReportStatistics(props), {
      initialProps,
    });

    // Initially loading
    expect(result.current.isBillingLoading).toBe(true);
    expect(result.current.billingResult).toBeNull();

    // Resolve initial billing calculation
    resolveBillingPromise!(mockBillingResult);
    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });
    expect(result.current.billingResult).toEqual(mockBillingResult);

    // 1. Changing reportPeriod must clear stale billingResult immediately and set isBillingLoading: true
    let resolveSecondPromise: ((val: RangeBillingResult) => void) | undefined;
    calculateRangeBillingMock.mockImplementation(
      () =>
        new Promise<RangeBillingResult>((resolve) => {
          resolveSecondPromise = resolve;
        })
    );

    rerender({
      ...initialProps,
      reportPeriod: 'month',
    });

    expect(result.current.billingResult).toBeNull();
    expect(result.current.isBillingLoading).toBe(true);

    // Resolve second calculation
    resolveSecondPromise!(mockBillingResult);
    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });
    expect(result.current.billingResult).toEqual(mockBillingResult);

    // 2. Changing selectedProjectId must clear stale billingResult immediately and set isBillingLoading: true
    let resolveThirdPromise: ((val: RangeBillingResult) => void) | undefined;
    calculateRangeBillingMock.mockImplementation(
      () =>
        new Promise<RangeBillingResult>((resolve) => {
          resolveThirdPromise = resolve;
        })
    );

    rerender({
      ...initialProps,
      reportPeriod: 'month',
      selectedProjectId: 'p2',
    });

    expect(result.current.billingResult).toBeNull();
    expect(result.current.isBillingLoading).toBe(true);

    resolveThirdPromise!(mockBillingResult);
    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });
    expect(result.current.billingResult).toEqual(mockBillingResult);
  });

  it('should calculate periodTotalSec, dailyAverageSec, and topProject exclusively from selected project logs', async () => {
    // When no project is selected: both p1 (3600s) and p2 (7200s) are included in week stats
    const { result, rerender } = renderHook((props) => useReportStatistics(props), {
      initialProps: {
        logs,
        patches,
        projects,
        tasks,
        nowIso: '2026-07-12T15:00:00Z',
        reportPeriod: 'week',
        reportSort: 'duration',
        selectedProjectId: null as string | null,
        sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
      },
    });

    expect(result.current.periodTotalSec).toBe(10800); // 3600 + 7200
    expect(result.current.dailyAverageSec).toBe(Math.round(10800 / 7));
    expect(result.current.topProject?.id).toBe('p2');
    expect(result.current.topProject?.seconds).toBe(7200);
    expect(result.current.projectChart).toHaveLength(2);

    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });

    // When selectedProjectId is 'p1': only p1 logs (3600s) must be computed
    rerender({
      logs,
      patches,
      projects,
      tasks,
      nowIso: '2026-07-12T15:00:00Z',
      reportPeriod: 'week',
      reportSort: 'duration',
      selectedProjectId: 'p1',
      sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
    });

    expect(result.current.periodTotalSec).toBe(3600);
    expect(result.current.dailyAverageSec).toBe(Math.round(3600 / 7));
    expect(result.current.topProject?.id).toBe('p1');
    expect(result.current.topProject?.name).toBe('Project Alpha');
    expect(result.current.topProject?.seconds).toBe(3600);
    expect(result.current.topProject?.percentage).toBe(100);
    expect(result.current.projectChart).toHaveLength(1);
    expect(result.current.projectChart[0].id).toBe('p1');
    expect(result.current.projectChart[0].seconds).toBe(3600);
    expect(result.current.filteredLogs).toHaveLength(1);
    expect(result.current.filteredLogs[0].id).toBe('l1');

    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });

    // When selectedProjectId is 'p2': only p2 logs (7200s) must be computed
    rerender({
      logs,
      patches,
      projects,
      tasks,
      nowIso: '2026-07-12T15:00:00Z',
      reportPeriod: 'week',
      reportSort: 'duration',
      selectedProjectId: 'p2',
      sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
    });

    expect(result.current.periodTotalSec).toBe(7200);
    expect(result.current.dailyAverageSec).toBe(Math.round(7200 / 7));
    expect(result.current.topProject?.id).toBe('p2');
    expect(result.current.topProject?.name).toBe('Project Beta');
    expect(result.current.topProject?.seconds).toBe(7200);
    expect(result.current.topProject?.percentage).toBe(100);
    expect(result.current.projectChart).toHaveLength(1);
    expect(result.current.projectChart[0].id).toBe('p2');
    expect(result.current.projectChart[0].seconds).toBe(7200);
    expect(result.current.filteredLogs).toHaveLength(1);
    expect(result.current.filteredLogs[0].id).toBe('l2');

    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });
  });

  describe('Tag Filtering in Billing Calculation', () => {
    const taggedProjects: Project[] = [
      { id: 'p1', name: 'Project Alpha', color: 'rose', createdAt: '2026-06-12T00:00:00Z', tags: ['frontend', 'client'] },
      { id: 'p2', name: 'Project Beta', color: 'blue', createdAt: '2026-06-12T00:00:00Z', tags: ['backend', 'internal'] },
      { id: 'p3', name: 'Project Gamma', color: 'green', createdAt: '2026-06-12T00:00:00Z', tags: ['frontend', 'internal'] },
    ];

    it('should pass matching projectIds to billing filter when selectedTags are provided', async () => {
      const { result } = renderHook(() =>
        useReportStatistics({
          logs,
          patches,
          projects: taggedProjects,
          tasks,
          nowIso: '2026-07-12T15:00:00Z',
          reportPeriod: 'week',
          reportSort: 'duration',
          selectedTags: ['frontend'],
          sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
        })
      );

      await waitFor(() => {
        expect(result.current.isBillingLoading).toBe(false);
      });

      expect(calculateRangeBillingMock).toHaveBeenCalledWith(
        expect.objectContaining({
          projectIds: expect.arrayContaining(['p1', 'p3']),
        }),
        '2026-07-12T15:00:00Z'
      );
      const lastCall = calculateRangeBillingMock.mock.calls[0][0];
      expect(lastCall.projectIds).toHaveLength(2);
      expect(lastCall.projectIds).not.toContain('p2');
    });

    it('should pass empty projectIds when selectedTags match no projects', async () => {
      const { result } = renderHook(() =>
        useReportStatistics({
          logs,
          patches,
          projects: taggedProjects,
          tasks,
          nowIso: '2026-07-12T15:00:00Z',
          reportPeriod: 'week',
          reportSort: 'duration',
          selectedTags: ['non-existent-tag'],
          sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
        })
      );

      await waitFor(() => {
        expect(result.current.isBillingLoading).toBe(false);
      });

      expect(calculateRangeBillingMock).toHaveBeenCalledWith(
        expect.objectContaining({
          projectIds: [],
        }),
        '2026-07-12T15:00:00Z'
      );
    });

    it('should recalculate billing when selectedTags change', async () => {
      const { result, rerender } = renderHook((props) => useReportStatistics(props), {
        initialProps: {
          logs,
          patches,
          projects: taggedProjects,
          tasks,
          nowIso: '2026-07-12T15:00:00Z',
          reportPeriod: 'week',
          reportSort: 'duration',
          selectedTags: ['backend'],
          sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
        },
      });

      await waitFor(() => {
        expect(result.current.isBillingLoading).toBe(false);
      });

      expect(calculateRangeBillingMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          projectIds: ['p2'],
        }),
        '2026-07-12T15:00:00Z'
      );

      rerender({
        logs,
        patches,
        projects: taggedProjects,
        tasks,
        nowIso: '2026-07-12T15:00:00Z',
        reportPeriod: 'week',
        reportSort: 'duration',
        selectedTags: ['client'],
        sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
      });

      await waitFor(() => {
        expect(result.current.isBillingLoading).toBe(false);
      });

      expect(calculateRangeBillingMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          projectIds: ['p1'],
        }),
        '2026-07-12T15:00:00Z'
      );
    });
  });

  it('should compute statistics when custom date range and project filter work together', async () => {
    const { result, rerender } = renderHook(
      (props) => useReportStatistics(props),
      {
        initialProps: {
          logs: [
            { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-10T10:00:00Z', endTime: '2026-06-10T11:00:00Z' },
            { id: 'l2', taskId: 't1', projectId: 'p1', startTime: '2026-06-20T10:00:00Z', endTime: '2026-06-20T12:00:00Z' },
            { id: 'l3', taskId: 't2', projectId: 'p2', startTime: '2026-06-20T10:00:00Z', endTime: '2026-06-20T13:00:00Z' },
          ],
          patches: [],
          projects: [
            { id: 'p1', name: 'Alpha', color: 'indigo', createdAt: '2026-06-01' },
            { id: 'p2', name: 'Beta', color: 'emerald', createdAt: '2026-06-01' },
          ],
          tasks: [
            { id: 't1', projectId: 'p1', name: 'Task Alpha', completed: false, createdAt: '2026-06-01' },
            { id: 't2', projectId: 'p2', name: 'Task Beta', completed: false, createdAt: '2026-06-01' },
          ],
          nowIso: '2026-06-25T15:00:00Z',
          reportPeriod: 'custom',
          customFrom: '2026-06-15',
          customTo: '2026-06-22',
          reportSort: 'duration',
          selectedProjectId: 'p1',
          sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
        },
      }
    );

    // In date range June 15 - June 22 and for project p1:
    // l1 is June 10 (outside range) -> excluded
    // l2 is June 20 (inside range, p1) -> 7200s
    // l3 is June 20 (inside range, but p2) -> excluded because selectedProjectId is p1
    expect(result.current.periodTotalSec).toBe(7200);
    expect(result.current.filteredLogs).toHaveLength(1);
    expect(result.current.filteredLogs[0].id).toBe('l2');
    expect(result.current.projectChart).toHaveLength(1);
    expect(result.current.projectChart[0].id).toBe('p1');
    expect(result.current.projectChart[0].seconds).toBe(7200);

    // Now switch to p2 in the same custom date range
    rerender({
      logs: [
        { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-10T10:00:00Z', endTime: '2026-06-10T11:00:00Z' },
        { id: 'l2', taskId: 't1', projectId: 'p1', startTime: '2026-06-20T10:00:00Z', endTime: '2026-06-20T12:00:00Z' },
        { id: 'l3', taskId: 't2', projectId: 'p2', startTime: '2026-06-20T10:00:00Z', endTime: '2026-06-20T13:00:00Z' },
      ],
      patches: [],
      projects: [
        { id: 'p1', name: 'Alpha', color: 'indigo', createdAt: '2026-06-01' },
        { id: 'p2', name: 'Beta', color: 'emerald', createdAt: '2026-06-01' },
      ],
      tasks: [
        { id: 't1', projectId: 'p1', name: 'Task Alpha', completed: false, createdAt: '2026-06-01' },
        { id: 't2', projectId: 'p2', name: 'Task Beta', completed: false, createdAt: '2026-06-01' },
      ],
      nowIso: '2026-06-25T15:00:00Z',
      reportPeriod: 'custom',
      customFrom: '2026-06-15',
      customTo: '2026-06-22',
      reportSort: 'duration',
      selectedProjectId: 'p2',
      sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
    });

    // For p2: l3 is inside range (10800s)
    expect(result.current.periodTotalSec).toBe(10800);
    expect(result.current.filteredLogs).toHaveLength(1);
    expect(result.current.filteredLogs[0].id).toBe('l3');
    expect(result.current.projectChart).toHaveLength(1);
    expect(result.current.projectChart[0].id).toBe('p2');
    expect(result.current.projectChart[0].seconds).toBe(10800);

    // Now clear project filter: both l2 and l3 should be included
    rerender({
      logs: [
        { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-10T10:00:00Z', endTime: '2026-06-10T11:00:00Z' },
        { id: 'l2', taskId: 't1', projectId: 'p1', startTime: '2026-06-20T10:00:00Z', endTime: '2026-06-20T12:00:00Z' },
        { id: 'l3', taskId: 't2', projectId: 'p2', startTime: '2026-06-20T10:00:00Z', endTime: '2026-06-20T13:00:00Z' },
      ],
      patches: [],
      projects: [
        { id: 'p1', name: 'Alpha', color: 'indigo', createdAt: '2026-06-01' },
        { id: 'p2', name: 'Beta', color: 'emerald', createdAt: '2026-06-01' },
      ],
      tasks: [
        { id: 't1', projectId: 'p1', name: 'Task Alpha', completed: false, createdAt: '2026-06-01' },
        { id: 't2', projectId: 'p2', name: 'Task Beta', completed: false, createdAt: '2026-06-01' },
      ],
      nowIso: '2026-06-25T15:00:00Z',
      reportPeriod: 'custom',
      customFrom: '2026-06-15',
      customTo: '2026-06-22',
      reportSort: 'duration',
      selectedProjectId: null,
      sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
    });

    expect(result.current.periodTotalSec).toBe(18000); // 7200 + 10800
    expect(result.current.filteredLogs).toHaveLength(2);
    expect(result.current.projectChart).toHaveLength(2);
  });
});
