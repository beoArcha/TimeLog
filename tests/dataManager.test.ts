import { describe, it, expect } from 'vitest';
import { DataManager } from '../src/utils/dataManager';

describe('DataManager Logic Tests', () => {
  it('should generate next id sequentially for numeric ids', () => {
    const items = [
      { id: '1' },
      { id: '2' },
      { id: '3' }
    ];
    const nextId = DataManager.getNextId(items);
    expect(nextId).toBe('4');
  });

  it('should generate next id sequentially for prefixed ids (holidays)', () => {
    const items = [
      { id: 'hol_1' },
      { id: 'hol_2' },
      { id: 'hol_5' }
    ];
    const nextId = DataManager.getNextId(items, 'hol_');
    expect(nextId).toBe('hol_6');
  });

  it('should fallback to 1 if no items', () => {
    const nextId = DataManager.getNextId([], 'log_');
    expect(nextId).toBe('log_1');
  });

  it('should handle large gaps appropriately', () => {
    const items = [
      { id: '10' },
      { id: '99' }
    ];
    const nextId = DataManager.getNextId(items);
    expect(nextId).toBe('100');
  });
});
