import type { RangePreset } from '@bindings/RangePreset';
import type { RangeRequest } from '@bindings/RangeRequest';
import type { ResolvedRange } from '@bindings/ResolvedRange';
import { formatUtc } from './formatUtc';
import { boundToInstant, parseBound } from './parseBound';
import { presetDays } from './presets';
import { MSG_EMPTY_BOUNDS, MSG_PRESET_WITH_BOUNDS, invalidRangeInput, invalidTimezone } from './rangeErrors';
import { isKnownTimeZone } from './timezone';
import { resolveLocal } from './zonedTime';

interface Bounds {
  from?: number;
  to?: number;
}

function resolvePreset(request: RangeRequest, preset: RangePreset, now: Date, timeZone: string): Bounds {
  if (request.from != null || request.to != null) {
    throw invalidRangeInput(MSG_PRESET_WITH_BOUNDS);
  }

  const days = presetDays(preset, now, timeZone);
  return days ? { from: resolveLocal(days[0], timeZone), to: resolveLocal(days[1], timeZone) } : {};
}

function resolveCustom(request: RangeRequest, timeZone: string): Bounds {
  const bounds: Bounds = {};
  if (request.from != null) bounds.from = boundToInstant(parseBound(request.from, timeZone), timeZone, false);
  if (request.to != null) bounds.to = boundToInstant(parseBound(request.to, timeZone), timeZone, true);
  return bounds;
}

/**
 * Half-open `[from, to)` UTC bounds computed on the local calendar of `timeZone`.
 * Mirrors `resolve_range_at` in `src-tauri/src/engine/range.rs`.
 */
export function resolveRangeAt(request: RangeRequest, now: Date, timeZone: string): ResolvedRange {
  if (!isKnownTimeZone(timeZone)) throw invalidTimezone(timeZone);

  const { from, to } =
    request.preset === undefined ? resolveCustom(request, timeZone) : resolvePreset(request, request.preset, now, timeZone);

  if (from !== undefined && to !== undefined && from >= to) {
    throw invalidRangeInput(MSG_EMPTY_BOUNDS);
  }

  const resolved: ResolvedRange = { timezone: timeZone };
  if (from !== undefined) resolved.from = formatUtc(from);
  if (to !== undefined) resolved.to = formatUtc(to);
  if (request.preset !== undefined) resolved.preset = request.preset;
  return resolved;
}
