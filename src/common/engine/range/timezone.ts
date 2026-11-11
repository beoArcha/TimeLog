import { invalidTimezone } from './rangeErrors';

const SYSTEM_TIMEZONE = 'system';
const DEFAULT_TIMEZONE = 'UTC';
const OFFSET_ZONE = /^[+-]/;

let canonicalNames: ReadonlySet<string> | null = null;

function canonicalNameSet(): ReadonlySet<string> {
  canonicalNames ??= new Set(Intl.supportedValuesOf('timeZone'));
  return canonicalNames;
}

function engineCanonicalName(name: string): string | null {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: name }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

// IANA link names such as `US/Eastern` start every path segment with an uppercase letter.
function hasConventionalCasing(name: string): boolean {
  return name.split('/').every((segment) => /^[A-Z]/.test(segment));
}

/**
 * Intl matches zone names case-insensitively and accepts offset zones such as `+01:00`, while the Rust
 * engine (chrono-tz) is case-sensitive and IANA-only. Alias spellings cannot be verified against a name
 * list, so for them only the casing convention is checked.
 */
export function isKnownTimeZone(name: string): boolean {
  const canonical = engineCanonicalName(name);
  if (canonical === null || OFFSET_ZONE.test(name)) return false;
  if (canonical === name || canonicalNameSet().has(name)) return true;
  if (canonical.toLowerCase() === name.toLowerCase()) return false;
  return hasConventionalCasing(name);
}

// UTC is the documented, visible default when the OS zone is undetectable or unknown.
function systemTimeZone(): string {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return detected && isKnownTimeZone(detected) ? detected : DEFAULT_TIMEZONE;
}

/** `explicit` wins over `setting`; blank values count as absent and `System` means the OS zone. */
export function resolveTimezone(explicit?: string | null, setting?: string | null): string {
  const chosen = [explicit, setting].map((value) => value?.trim()).find((value) => value);

  if (!chosen || chosen.toLowerCase() === SYSTEM_TIMEZONE) return systemTimeZone();
  if (!isKnownTimeZone(chosen)) throw invalidTimezone(chosen);
  return chosen;
}
