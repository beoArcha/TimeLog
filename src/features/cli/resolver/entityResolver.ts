import { CliErrorCandidate } from '@bindings/CliErrorCandidate';
import { CliErrorDetails } from '@bindings/CliErrorDetails';
import { buildErrorEnvelope, isMachineMode } from '../sandbox/router/sandboxEnvelope';

/**
 * Calculates Levenshtein distance between two strings using dynamic programming.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

export type ResolveResult<T> =
  | {
      entity: T;
      error?: never;
      errorCode?: never;
      exitCode?: 0;
      details?: never;
    }
  | {
      entity?: never;
      error: string;
      errorCode: string;
      exitCode: number;
      details?: CliErrorDetails;
    };

// Mirrors ERR_RESOLVE_NOT_FOUND in src-tauri/src/cli/resolver/constants.rs
export const RESOLVE_NOT_FOUND_TEMPLATE = "{} '{}' not found.";

// Mirrors ERR_RESOLVE_AMBIGUOUS in src-tauri/src/cli/resolver/constants.rs
export const RESOLVE_AMBIGUOUS_TEMPLATE =
  "Ambiguous {} target '{}'. Matched: {}. Please specify a unique ID or title.";

// 8 characters provides sufficient entropy to prevent accidental collisions
// in automated scripts and pipelines while keeping shortened ID references ergonomic.
export const MIN_MACHINE_PREFIX_LEN = 8;

export function isStrictResolution(
  flags?: Record<string, unknown> | Record<string, string | boolean>
): boolean {
  if (!flags) return false;
  return Boolean(flags['json'] || flags['machine'] || flags['exact']);
}

export function reportResolveFailure<T>(
  resolve: ResolveResult<T>,
  output: { error: (msg: string, code?: string, exitCode?: number) => void },
  flags?: Record<string, string | boolean>
): void {
  if (!resolve.error) return;

  if (flags && isMachineMode(flags)) {
    const envelope = buildErrorEnvelope(
      resolve.errorCode,
      resolve.error,
      resolve.exitCode,
      resolve.details
    );
    output.error(JSON.stringify(envelope), resolve.errorCode, resolve.exitCode);
    return;
  }

  output.error(resolve.error, resolve.errorCode, resolve.exitCode);
}

function buildAmbiguousResult<T>(
  matches: T[],
  trimmed: string,
  entityTypeName: 'Task' | 'Project',
  idFn: (e: T) => string,
  nameFn: (e: T) => string
): ResolveResult<T> {
  const list = matches.map((m) => `"${nameFn(m)}" (${idFn(m)})`).join(', ');
  const candidates: CliErrorCandidate[] = matches.map((m) => ({
    id: idFn(m),
    name: nameFn(m),
  }));
  return {
    error: RESOLVE_AMBIGUOUS_TEMPLATE.replace('{}', entityTypeName)
      .replace('{}', trimmed)
      .replace('{}', list),
    exitCode: 4,
    errorCode: 'DOM_ENTITY_AMBIGUOUS',
    details: {
      candidates,
    },
  };
}

function resolveStrictEntity<T>(
  entities: T[],
  trimmed: string,
  entityTypeName: 'Task' | 'Project',
  idFn: (e: T) => string,
  nameFn: (e: T) => string
): ResolveResult<T> {
  const clean = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;

  const exactId = entities.find((e) => idFn(e) === trimmed || idFn(e) === clean);
  if (exactId) {
    return { entity: exactId, exitCode: 0 };
  }

  if (clean.length >= MIN_MACHINE_PREFIX_LEN) {
    const prefixMatches = entities.filter((e) => idFn(e).startsWith(clean));
    if (prefixMatches.length === 1) {
      return { entity: prefixMatches[0], exitCode: 0 };
    }
    if (prefixMatches.length > 1) {
      return buildAmbiguousResult(prefixMatches, trimmed, entityTypeName, idFn, nameFn);
    }
  }

  const targetLower = trimmed.toLowerCase();
  const nameMatches = entities.filter((e) => nameFn(e).toLowerCase() === targetLower);
  if (nameMatches.length === 1) {
    return { entity: nameMatches[0], exitCode: 0 };
  }
  if (nameMatches.length > 1) {
    return buildAmbiguousResult(nameMatches, trimmed, entityTypeName, idFn, nameFn);
  }

  return {
    error: RESOLVE_NOT_FOUND_TEMPLATE.replace('{}', entityTypeName).replace('{}', trimmed),
    exitCode: 4,
    errorCode: 'DOM_ENTITY_NOT_FOUND',
  };
}

function resolveHumanEntity<T>(
  entities: T[],
  trimmed: string,
  entityTypeName: 'Task' | 'Project',
  idFn: (e: T) => string,
  nameFn: (e: T) => string
): ResolveResult<T> {
  const exactId = entities.find((e) => idFn(e) === trimmed);
  if (exactId) {
    return { entity: exactId, exitCode: 0 };
  }

  const prefixId = entities.filter((e) => idFn(e).startsWith(trimmed));
  if (prefixId.length === 1) {
    return { entity: prefixId[0], exitCode: 0 };
  }

  const targetLower = trimmed.toLowerCase();
  const nameMatches = entities.filter(
    (e) => nameFn(e).toLowerCase() === targetLower || nameFn(e).toLowerCase().includes(targetLower)
  );

  if (nameMatches.length === 1) {
    return { entity: nameMatches[0], exitCode: 0 };
  }

  if (nameMatches.length > 1) {
    const list = nameMatches.map((m) => `"${nameFn(m)}" (${idFn(m)})`).join(', ');
    const candidates: CliErrorCandidate[] = nameMatches.map((m) => ({
      id: idFn(m),
      name: nameFn(m),
    }));
    return {
      error: `Error: Multiple matching ${entityTypeName.toLowerCase()}s found: ${list}. Specify exact ID or name.`,
      exitCode: 4,
      errorCode: 'DOM_ENTITY_AMBIGUOUS',
      details: {
        candidates,
      },
    };
  }

  let bestCandidate: T | null = null;
  let bestDistance = 3;

  for (const entity of entities) {
    const nameDist = levenshteinDistance(trimmed, nameFn(entity));
    const idDist = levenshteinDistance(trimmed, idFn(entity));
    const minCandidateDist = Math.min(nameDist, idDist);

    if (minCandidateDist < bestDistance) {
      bestDistance = minCandidateDist;
      bestCandidate = entity;
    }
  }

  if (bestCandidate) {
    return {
      error: `Error: ${entityTypeName} "${trimmed}" not found. Did you mean: "${nameFn(bestCandidate)}"?`,
      exitCode: 4,
      errorCode: 'DOM_ENTITY_DID_YOU_MEAN',
      details: {
        suggestion: {
          id: idFn(bestCandidate),
          name: nameFn(bestCandidate),
        },
      },
    };
  }

  return {
    error: `Error: ${entityTypeName} "${trimmed}" does not exist`,
    exitCode: 4,
    errorCode: 'DOM_ENTITY_NOT_FOUND',
  };
}

/**
 * Resolves an entity either strictly (in machine mode) or with prefix/substring/typo fallbacks (in human mode).
 */
export function resolveEntity<T>(
  entities: T[],
  target: string,
  entityTypeName: 'Task' | 'Project',
  idFn: (e: T) => string,
  nameFn: (e: T) => string,
  strict = false
): ResolveResult<T> {
  const trimmed = target.trim();
  if (!trimmed) {
    return {
      error: `Error: ${entityTypeName} target cannot be empty`,
      exitCode: 2,
      errorCode: 'CLI_SYNTAX_EMPTY_ID',
    };
  }

  if (strict) {
    return resolveStrictEntity(entities, trimmed, entityTypeName, idFn, nameFn);
  }

  return resolveHumanEntity(entities, trimmed, entityTypeName, idFn, nameFn);
}
