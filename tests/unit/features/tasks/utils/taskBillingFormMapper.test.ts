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

    it('returns custom mode when billingRateCents is present and hourlyRate is missing', () => {
      const state = getTaskBillingFormInitialState({
        billingRateCents: 25000,
        hourlyRate: null,
      });
      expect(state).toEqual({
        mode: 'custom',
        customRate: '250.00',
      });
    });

    it('supports bigint billingRateCents when hourlyRate is missing', () => {
      const state = getTaskBillingFormInitialState({
        billingRateCents: 18550n,
        hourlyRate: undefined,
      });
      expect(state).toEqual({
        mode: 'custom',
        customRate: '185.50',
      });
    });

    it('prioritizes canonical billingRateCents over conflicting hourlyRate', () => {
      const state = getTaskBillingFormInitialState({
        billingRateCents: 30000,
        hourlyRate: '99.00',
      });
      expect(state).toEqual({
        mode: 'custom',
        customRate: '300.00',
      });
    });

    it('returns custom mode when both values are present and consistent', () => {
      const state = getTaskBillingFormInitialState({
        billingRateCents: 15000,
        hourlyRate: '150.00',
      });
      expect(state).toEqual({
        mode: 'custom',
        customRate: '150.00',
      });
    });

    it('returns inherit mode when both values are absent', () => {
      const state = getTaskBillingFormInitialState({});
      expect(state).toEqual({
        mode: 'inherit',
        customRate: '',
      });
    });

    it('returns inherit mode when both values are explicit null', () => {
      const state = getTaskBillingFormInitialState({
        hourlyRate: null,
        billingRateCents: null,
      });
      expect(state).toEqual({
        mode: 'inherit',
        customRate: '',
      });
    });

    it('returns non_billable mode when billingRateCents is explicit zero', () => {
      const state = getTaskBillingFormInitialState({
        billingRateCents: 0,
        hourlyRate: null,
      });
      expect(state).toEqual({
        mode: 'non_billable',
        customRate: '',
      });
    });

    it('returns non_billable mode when billingRateCents is bigint zero', () => {
      const state = getTaskBillingFormInitialState({
        billingRateCents: 0n,
        hourlyRate: '100.00', // canonical zero takes precedence
      });
      expect(state).toEqual({
        mode: 'non_billable',
        customRate: '',
      });
    });

    it('distinguishes explicit zero rate (non-billable) from missing rate (inherit)', () => {
      const zeroState = getTaskBillingFormInitialState({ billingRateCents: 0 });
      const missingState = getTaskBillingFormInitialState({ billingRateCents: null });
      expect(zeroState.mode).toBe('non_billable');
      expect(missingState.mode).toBe('inherit');
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
