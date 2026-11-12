import type { RuntimeConfig } from '@bindings/RuntimeConfig';
import { parseRateToCents } from './utils';

/** Mirrors `default_rate_cents_from_configs` in `src-tauri/src/engine/billing.rs`. */
export function defaultRateCentsFromConfigs(configs: readonly RuntimeConfig[]): number | null {
  const config = configs.find(
    (candidate) =>
      candidate.id === 'default_billing_rate' ||
      candidate.id === 'default_rate' ||
      candidate.runtime === 'billing_default'
  );
  return config ? parseRateToCents(config.config) : null;
}
