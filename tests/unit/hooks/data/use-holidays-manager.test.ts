import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useHolidaysManager } from '@common/hooks/data/useHolidaysManager';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';

describe('Unit Tests: useHolidaysManager Hook', () => {
  const router = PersistenceRouter.getInstance();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty holidays list', () => {
    const { result } = renderHook(() => useHolidaysManager());
    expect(result.current.holidays).toEqual([]);
  });

  it('should add a new holiday and persist it to repository', async () => {
    const saveSpy = vi.spyOn(router.holidays, 'save').mockResolvedValue();
    const { result } = renderHook(() => useHolidaysManager());

    await act(async () => {
      await result.current.handleAddHoliday('2026-12-25', 'holiday', 'Christmas Day');
    });

    expect(result.current.holidays).toHaveLength(1);
    expect(result.current.holidays[0].name).toBe('Christmas Day');
    expect(result.current.holidays[0].type).toBe('holiday');
    expect(saveSpy).toHaveBeenCalledWith(result.current.holidays);
  });

  it('should delete a holiday by id and persist updated list', async () => {
    const saveSpy = vi.spyOn(router.holidays, 'save').mockResolvedValue();
    const { result } = renderHook(() => useHolidaysManager());

    await act(async () => {
      await result.current.handleAddHoliday('2026-01-01', 'holiday', 'New Year');
    });

    const holidayId = result.current.holidays[0].id;

    await act(async () => {
      await result.current.handleDeleteHoliday(holidayId);
    });

    expect(result.current.holidays).toHaveLength(0);
    expect(saveSpy).toHaveBeenCalledWith([]);
  });

  it('should notify onError when persistence save fails', async () => {
    const onError = vi.fn();
    vi.spyOn(router.holidays, 'save').mockRejectedValue(new Error('Storage failure'));
    const { result } = renderHook(() => useHolidaysManager({ onError }));

    await act(async () => {
      await result.current.handleAddHoliday('2026-05-01', 'holiday', 'Labor Day');
    });

    expect(onError).toHaveBeenCalledWith('Storage failure');
  });
});
