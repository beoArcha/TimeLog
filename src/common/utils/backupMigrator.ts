export interface RawLegacyPayload {
  version?: unknown;
  projects?: unknown;
  tasks?: unknown;
  logs?: unknown;
  holidays?: unknown;
  patches?: unknown;
  state?: unknown;
  [key: string]: unknown;
}

export function normalizeLegacyProject(p: unknown): unknown {
  if (typeof p !== 'object' || p === null || Array.isArray(p)) {
    return p;
  }
  const item = p as Record<string, unknown>;
  const hasValidId = typeof item.id === 'string' && item.id.trim() !== '';
  const hasValidName = typeof item.name === 'string' && item.name.trim() !== '';
  const lacksColor = typeof item.color !== 'string' || item.color.trim() === '';

  if (hasValidId && hasValidName && lacksColor) {
    return { ...item, color: 'violet' };
  }
  return p;
}

function parseNestedState(rawState: unknown): Record<string, unknown> | null {
  if (!rawState) {
    return null;
  }
  if (typeof rawState === 'string') {
    try {
      const parsed = JSON.parse(rawState);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  if (typeof rawState === 'object' && !Array.isArray(rawState)) {
    return rawState as Record<string, unknown>;
  }
  return null;
}

/**
 * Normalizes legacy backup payloads into standard structure.
 * Handles:
 * - Shape A: Root-level state dump (`{ projects: [...], tasks: [...] }`)
 * - Shape B: Nested plain object (`{ state: { projects: [...] } }`)
 * - Shape C: Stringified nested state (`{ state: "{\"projects\":[...]}" }`)
 * - Shape D: Hybrid with conflict precedence (root collections take precedence, missing collections fall back to state)
 * - Universal normalization of project colors (defaulting missing color to 'violet') across all shapes
 */
export function migrateLegacyBackup(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return raw as unknown as Record<string, unknown>;
  }

  const payload = raw as RawLegacyPayload;
  const nested = parseNestedState(payload.state);
  const merged: Record<string, unknown> = nested ? { ...nested, ...payload } : { ...payload };

  if (nested) {
    for (const key of Object.keys(nested)) {
      if (payload[key] === undefined) {
        merged[key] = nested[key];
      }
    }
  }

  if (Array.isArray(merged.projects)) {
    merged.projects = merged.projects.map(normalizeLegacyProject);
  }

  return merged;
}
