/** RFC3339 UTC with a `Z` suffix and whole seconds; sub-second parts are dropped, as chrono's `SecondsFormat::Secs` does. */
export function formatUtc(instantMs: number): string {
  const wholeSecondMs = Math.floor(instantMs / 1000) * 1000;
  return new Date(wholeSecondMs).toISOString().replace('.000Z', 'Z');
}
