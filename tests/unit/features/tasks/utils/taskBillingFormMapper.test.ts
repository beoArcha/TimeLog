import { describe, it, expect } from 'vitest';
import {
  getTaskBillingFormInitialState,
  mapBillingFormToHourlyRate,
} from '@features/tasks/utils/taskBillingFormMapper';

describe('Unit Tests: taskBillingFormMapper', () => {
  describe('getTaskBillingFormInitialState', () => {
    it('returns inherit mode with empty customRate when hourlyRate is null', () => {
      const state = getTaskBillingFormInitialState({ hourlyRate: null });
      expect(state).toEqual({
        mode: 'inherit',
        customRate: '',
      });
    });

    it('returns inherit mode with empty customRate when hourlyRate is undefined', () => {
      const state = getTaskBillingFormInitialState({ hourlyRate: undefined });
      expect(state).toEqual({
        mode: 'inherit',
        customRate: '',
      });
    });

    it('returns non_billable mode with empty customRate when hourlyRate is "0"', () => {
      const state = getTaskBillingFormInitialState({ hourlyRate: '0' });
      expect(state).toEqual({
        mode: 'non_billable',
        customRate: '',
      });
    });

    it('returns non_billable mode with empty customRate when hourlyRate is "0.00"', () => {
      const state = getTaskBillingFormInitialState({ hourlyRate: '0.00' });
      expect(state).toEqual({
        mode: 'non_billable',
        customRate: '',
      });
    });

    it('returns custom mode with existing rate when hourlyRate is configured', () => {
      const state = getTaskBillingFormInitialState({ hourlyRate: '150.00' });
      expect(state).toEqual({
        mode: 'custom',
        customRate: '150.00',
      });
    });
  });

  describe('mapBillingFormToHourlyRate', () => {
    it('maps inherit mode to null', () => {
      expect(mapBillingFormToHourlyRate('inherit', '120.00')).toBeNull();
    });

    it('maps non_billable mode to "0.00"', () => {
      expect(mapBillingFormToHourlyRate('non_billable', '120.00')).toBe('0.00');
    });

    it('maps custom mode with value to trimmed rate', () => {
      expect(mapBillingFormToHourlyRate('custom', '  175.50  ')).toBe('175.50');
    });

    it('maps custom mode with empty string to null', () => {
      expect(mapBillingFormToHourlyRate('custom', '   ')).toBeNull();
    });
  });
});
