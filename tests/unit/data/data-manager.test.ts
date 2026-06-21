import { describe, it, expect } from 'vitest';
import { LocalStorageDataManager as DataManager } from '@core/data/dataManager';

describe('Unit Tests: DataManager Logic', () => {
  it('should_generate_next_id_sequentially_for_numeric_ids_when_items_are_provided', () => {
    const items = [
      { id: '1' },
      { id: '2' },
      { id: '3' }
    ];
    const nextId = DataManager.getNextId(items);
    expect(nextId).toBe('4');
  });

  it('should_generate_next_id_sequentially_for_prefixed_ids_when_prefixed_items_are_provided', () => {
    const items = [
      { id: 'hol_1' },
      { id: 'hol_2' },
      { id: 'hol_5' }
    ];
    const nextId = DataManager.getNextId(items, 'hol_');
    expect(nextId).toBe('hol_6');
  });

  it('should_fallback_to_one_when_no_items_are_present', () => {
    const nextId = DataManager.getNextId([], 'log_');
    expect(nextId).toBe('log_1');
  });

  it('should_handle_large_gaps_appropriately_when_calculating_next_id', () => {
    const items = [
      { id: '10' },
      { id: '99' }
    ];
    const nextId = DataManager.getNextId(items);
    expect(nextId).toBe('100');
  });
});
