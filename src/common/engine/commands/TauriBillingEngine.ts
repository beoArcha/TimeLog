import { invoke } from '@tauri-apps/api/core';
import { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';
import {
  IBillingEngine,
  EffectiveRateResult,
  RangeBillingResult,
} from '../billing/types';
import { ErrorHandler, TauriInteropException } from '@common/exceptions';

export class TauriBillingEngine implements IBillingEngine {
  async resolveEffectiveTaskRate(taskId: string): Promise<EffectiveRateResult> {
    try {
      return await invoke<EffectiveRateResult>('billing_resolve_effective_rate', { taskId });
    } catch (err) {
      ErrorHandler.handle(
        new TauriInteropException(
          'Failed to resolve effective task rate via Tauri',
          err,
          'ERR_TAURI_BILLING_RESOLVE_RATE'
        )
      );
      throw err;
    }
  }

  async calculateRangeBilling(
    range: ElapsedRangeFilter,
    nowIso?: string
  ): Promise<RangeBillingResult> {
    try {
      return await invoke<RangeBillingResult>('billing_calculate_range', { range, nowIso });
    } catch (err) {
      ErrorHandler.handle(
        new TauriInteropException(
          'Failed to calculate range billing via Tauri',
          err,
          'ERR_TAURI_BILLING_CALCULATE_RANGE'
        )
      );
      throw err;
    }
  }
}
