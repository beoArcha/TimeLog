import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePatchesManager } from '@common/hooks/data/usePatchesManager';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { PatchLog } from '@bindings/PatchLog';

describe('Unit Tests: usePatchesManager Hook', () => {
  const router = PersistenceRouter.getInstance();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty patches list', () => {
    const { result } = renderHook(() => usePatchesManager());
    expect(result.current.patches).toEqual([]);
  });

  it('should save patches and update state', async () => {
    const saveSpy = vi.spyOn(router.patches, 'save').mockResolvedValue();
    const { result } = renderHook(() => usePatchesManager());

    const mockPatches: PatchLog[] = [
      { id: 'patch-1', projectId: 'p1', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T11:00:00Z', patchNote: 'Initial import' }
    ];

    await act(async () => {
      await result.current.setPatches(mockPatches);
    });

    expect(result.current.patches).toEqual(mockPatches);
    expect(saveSpy).toHaveBeenCalledWith(mockPatches);
  });

  it('should notify onError when patch persistence fails', async () => {
    const onError = vi.fn();
    vi.spyOn(router.patches, 'save').mockRejectedValue(new Error('Disk write error'));
    const { result } = renderHook(() => usePatchesManager({ onError }));

    await act(async () => {
      await result.current.setPatches([]);
    });

    expect(onError).toHaveBeenCalledWith('Disk write error');
  });
});
