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

function normalizeLegacyProject(p: unknown): unknown {
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

/**
 * Normalizes legacy backup payloads into standard structure.
 * Handles:
 * - Payloads where state is nested under `state` (e.g. legacy LocalStorage state dumps)
 * - Missing non-critical project colors in legacy nested state exports
 */
export function migrateLegacyBackup(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return raw as unknown as Record<string, unknown>;
  }

  const payload = raw as RawLegacyPayload;
  if (!payload.state || typeof payload.state !== 'object' || Array.isArray(payload.state)) {
    return payload as Record<string, unknown>;
  }

  const sourceState = { ...payload, ...(payload.state as Record<string, unknown>) };
  if (Array.isArray(sourceState.projects)) {
    sourceState.projects = sourceState.projects.map(normalizeLegacyProject);
  }
  return sourceState;
}
