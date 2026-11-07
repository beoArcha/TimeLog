/**
 * Canonical tag normalization: trims whitespace and strips leading '#' if present.
 */
export function normalizeTag(tag: string): string {
  const trimmed = typeof tag === 'string' ? tag.trim() : '';
  return trimmed.startsWith('#') ? trimmed.slice(1).trim() : trimmed;
}
