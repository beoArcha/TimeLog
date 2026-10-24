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

export interface ResolveResult<T> {
  entity?: T;
  error?: string;
  exitCode: number;
}

/**
 * Resolves an entity by exact ID, prefix ID, substring name match, or Levenshtein typo suggestion.
 */
export function resolveEntity<T>(
  entities: T[],
  target: string,
  entityTypeName: 'Task' | 'Project',
  idFn: (e: T) => string,
  nameFn: (e: T) => string
): ResolveResult<T> {
  const trimmed = target.trim();
  if (!trimmed) {
    return {
      error: `Error: ${entityTypeName} target cannot be empty`,
      exitCode: 2,
    };
  }

  // 1. Exact ID match
  const exactId = entities.find((e) => idFn(e) === trimmed);
  if (exactId) {
    return { entity: exactId, exitCode: 0 };
  }

  // 2. Prefix ID match
  const prefixId = entities.filter((e) => idFn(e).startsWith(trimmed));
  if (prefixId.length === 1) {
    return { entity: prefixId[0], exitCode: 0 };
  }

  // 3. Name substring match
  const targetLower = trimmed.toLowerCase();
  const nameMatches = entities.filter(
    (e) => nameFn(e).toLowerCase() === targetLower || nameFn(e).toLowerCase().includes(targetLower)
  );

  if (nameMatches.length === 1) {
    return { entity: nameMatches[0], exitCode: 0 };
  }

  if (nameMatches.length > 1) {
    const list = nameMatches.map((m) => `"${nameFn(m)}" (${idFn(m)})`).join(', ');
    return {
      error: `Error: Multiple matching ${entityTypeName.toLowerCase()}s found: ${list}. Specify exact ID or name.`,
      exitCode: 4,
    };
  }

  // 4. Nearest typo suggestion via Levenshtein distance (threshold <= 2)
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
    };
  }

  return {
    error: `Error: ${entityTypeName} "${trimmed}" does not exist`,
    exitCode: 4,
  };
}
