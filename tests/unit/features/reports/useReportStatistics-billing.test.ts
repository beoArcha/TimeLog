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

describe('Unit Tests: useReportStatistics Billing Integration and Tag Filtering', () => {
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
    { id: 'p2', name: 'Project Beta', color: 'blue', createdAt: '2026-06-12T00:00:00Z' },
  ];

  const taggedProjects: Project[] = [
    { id: 'p1', name: 'Project Alpha', color: 'rose', createdAt: '2026-06-12T00:00:00Z', tags: ['frontend', 'client'] },
    { id: 'p2', name: 'Project Beta', color: 'blue', createdAt: '2026-06-12T00:00:00Z', tags: ['backend', 'internal'] },
    { id: 'p3', name: 'Project Gamma', color: 'green', createdAt: '2026-06-12T00:00:00Z', tags: ['frontend', 'internal'] },
  ];

  const tasks: Task[] = [
    { id: 't1', projectId: 'p1', parentTaskId: null, name: 'Task One', createdAt: '2026-06-12T00:00:00Z', completed: false },
    { id: 't2', projectId: 'p2', parentTaskId: null, name: 'Task Two', createdAt: '2026-06-12T00:00:00Z', completed: false },
  ];

  const logs: TimeLog[] = [
    {
      id: 'l1',
      projectId: 'p1',
      taskId: 't1',
      startTime: '2026-07-12T10:00:00Z',
      endTime: '2026-07-12T11:00:00Z',
      note: 'Log 1',
    },
    {
      id: 'l2',
      projectId: 'p2',
      taskId: 't2',
      startTime: '2026-07-11T12:00:00Z',
      endTime: '2026-07-11T14:00:00Z',
      note: 'Log 2',
    },
  ];

  const patches: PatchLog[] = [];

  it('should handle billing calculation failure gracefully and sanitize error message', async () => {
    // Arrange
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    calculateRangeBillingMock.mockRejectedValueOnce(new Error('Calculation failed'));

    // Act
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

    // Assert
    await waitFor(() => {
      expect(result.current.billingError).toBe('Failed to calculate range billing');
    });

    expect(result.current.isBillingLoading).toBe(false);
    expect(result.current.billingResult).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[useReportStatistics] Billing calculation failed:'),
      expect.objectContaining({ error: expect.any(Error) })
    );
  });

  it('should pass selectedProjectIds to billing calculation filter when provided', async () => {
    // Arrange & Act
    const { result } = renderHook(() =>
      useReportStatistics({
        logs,
        patches,
        projects,
        tasks,
        nowIso: '2026-07-12T15:00:00Z',
        reportPeriod: 'week',
        reportSort: 'duration',
        selectedProjectIds: ['p1'],
        sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
      })
    );

    // Assert
    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });

    expect(calculateRangeBillingMock).toHaveBeenCalledWith(
      expect.objectContaining({ projectIds: ['p1'] }),
      '2026-07-12T15:00:00Z'
    );
  });

  it('should handle EngineRouter instantiation failure gracefully and log to console', async () => {
    // Arrange
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(EngineRouter, 'getInstance').mockImplementation(() => {
      throw new Error('EngineRouter unavailable');
    });

    // Act
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

    // Assert
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

  it('should reset billingResult to null and set isBillingLoading to true when reportPeriod or selectedProjectIds changes', async () => {
    // Arrange
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
      selectedProjectIds: ['p1'],
      sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
    };

    // Act
    const { result, rerender } = renderHook((props) => useReportStatistics(props), {
      initialProps,
    });

    // Assert initial loading
    expect(result.current.isBillingLoading).toBe(true);
    expect(result.current.billingResult).toBeNull();

    resolveBillingPromise!(mockBillingResult);
    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });
    expect(result.current.billingResult).toEqual(mockBillingResult);

    // Act changing reportPeriod
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

    resolveSecondPromise!(mockBillingResult);
    await waitFor(() => {
      expect(result.current.isBillingLoading).toBe(false);
    });
    expect(result.current.billingResult).toEqual(mockBillingResult);
  });

  describe('Tag Filtering in Billing Calculation', () => {
    it('should pass matching projectIds to billing filter when selectedTags are provided', async () => {
      // Arrange & Act
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

      // Assert
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

    it('should return empty billing result without calling engine when selectedTags match no projects', async () => {
      // Arrange & Act
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

      // Assert
      await waitFor(() => {
        expect(result.current.isBillingLoading).toBe(false);
      });

      expect(calculateRangeBillingMock).not.toHaveBeenCalled();
      expect(result.current.billingResult).toEqual({
        byCurrency: {},
        byTask: [],
        totalBillableSeconds: 0,
        totalNonBillableSeconds: 0,
        totalUnconfiguredSeconds: 0,
      });
    });

    it('should return empty billing result without calling engine when selectedProjectIds do not match active tags', async () => {
      // Arrange & Act (p2 has tag ['backend'], but selectedTags is ['frontend'])
      const { result } = renderHook(() =>
        useReportStatistics({
          logs,
          patches,
          projects: taggedProjects,
          tasks,
          nowIso: '2026-07-12T15:00:00Z',
          reportPeriod: 'week',
          reportSort: 'duration',
          selectedProjectIds: ['p2'],
          selectedTags: ['frontend'],
          sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
        })
      );

      // Assert
      await waitFor(() => {
        expect(result.current.isBillingLoading).toBe(false);
      });

      expect(calculateRangeBillingMock).not.toHaveBeenCalled();
      expect(result.current.billingResult).toEqual({
        byCurrency: {},
        byTask: [],
        totalBillableSeconds: 0,
        totalNonBillableSeconds: 0,
        totalUnconfiguredSeconds: 0,
      });
    });

    it('should recalculate billing when selectedTags change', async () => {
      // Arrange
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

      expect(calculateRangeBillingMock).toHaveBeenCalledWith(
        expect.objectContaining({
          projectIds: ['p2'],
        }),
        '2026-07-12T15:00:00Z'
      );
      expect(calculateRangeBillingMock.mock.calls[0][0].projectId).toBeUndefined();

      // Act
      calculateRangeBillingMock.mockClear();
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

      // Assert
      await waitFor(() => {
        expect(result.current.isBillingLoading).toBe(false);
      });

      expect(calculateRangeBillingMock).toHaveBeenCalledWith(
        expect.objectContaining({
          projectIds: ['p1'],
        }),
        '2026-07-12T15:00:00Z'
      );
      expect(calculateRangeBillingMock.mock.calls[0][0].projectId).toBeUndefined();
    });

    it('should pass projectIds when selectedProjectIds match tags', async () => {
      const { result } = renderHook(() =>
        useReportStatistics({
          logs,
          patches,
          projects: taggedProjects,
          tasks,
          nowIso: '2026-07-12T15:00:00Z',
          reportPeriod: 'week',
          reportSort: 'duration',
          selectedProjectIds: ['p1'],
          selectedTags: ['frontend'],
          sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
        })
      );

      await waitFor(() => {
        expect(result.current.isBillingLoading).toBe(false);
      });

      expect(calculateRangeBillingMock).toHaveBeenCalledWith(
        expect.objectContaining({
          projectIds: ['p1'],
        }),
        '2026-07-12T15:00:00Z'
      );
      const call = calculateRangeBillingMock.mock.calls[0][0];
      expect(call.projectId).toBeUndefined();
    });

    it('should omit both projectId and projectIds when neither project nor tags are set', async () => {
      const { result } = renderHook(() =>
        useReportStatistics({
          logs,
          patches,
          projects: taggedProjects,
          tasks,
          nowIso: '2026-07-12T15:00:00Z',
          reportPeriod: 'week',
          reportSort: 'duration',
          sysSettings: { includePatchesInReports: false, autoStart: false, activeSinks: [] },
        })
      );

      await waitFor(() => {
        expect(result.current.isBillingLoading).toBe(false);
      });

      expect(calculateRangeBillingMock).toHaveBeenCalled();
      const call = calculateRangeBillingMock.mock.calls[0][0];
      expect(call.projectId).toBeUndefined();
      expect(call.projectIds).toBeUndefined();
    });
  });
});
