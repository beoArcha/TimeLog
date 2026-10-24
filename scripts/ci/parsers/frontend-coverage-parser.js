import fs from 'node:fs';
import { FRONTEND_MODULES } from '../constants.js';
import { findFilesRecursive, safeReadJson } from '../fs-utils.js';

const DEFAULT_CANDIDATE_SUMMARY_FILES = [
  'coverage-merged/coverage-summary.json',
  'coverage-reports/coverage-summary.json',
  'coverage-reports/unit/coverage-summary.json',
  'coverage-reports/integration/coverage-summary.json',
  'coverage-reports/coverage-unit/coverage-summary.json',
  'coverage-reports/coverage-integration/coverage-summary.json',
  'coverage/coverage-summary.json',
  'coverage/unit/coverage-summary.json',
  'coverage/integration/coverage-summary.json'
];

/**
 * Computes coverage stats for a single file entry in coverage-final format.
 *
 * @param {Record<string, any>} fileData
 * @returns {{ lines: { total: number, covered: number }, statements: { total: number, covered: number }, branches: { total: number, covered: number }, functions: { total: number, covered: number } }}
 */
function extractFileFinalMetrics(fileData) {
  let sTot = 0;
  let sCov = 0;
  let fTot = 0;
  let fCov = 0;
  let bTot = 0;
  let bCov = 0;

  if (fileData.s) {
    for (const count of Object.values(fileData.s)) {
      sTot++;
      if (Number(count) > 0) sCov++;
    }
  }

  if (fileData.f) {
    for (const count of Object.values(fileData.f)) {
      fTot++;
      if (Number(count) > 0) fCov++;
    }
  }

  if (fileData.b) {
    for (const branchArr of Object.values(fileData.b)) {
      for (const count of branchArr) {
        bTot++;
        if (Number(count) > 0) bCov++;
      }
    }
  }

  return {
    lines: { total: sTot, covered: sCov },
    statements: { total: sTot, covered: sCov },
    branches: { total: bTot, covered: bCov },
    functions: { total: fTot, covered: fCov }
  };
}

/**
 * Converts a raw coverage-final.json payload into a summary-like map containing file records and a total.
 *
 * @param {Record<string, any>} finalJson Raw coverage-final JSON object.
 * @returns {Record<string, any>} Summary data object containing file keys and `total`.
 */
function aggregateFromCoverageFinal(finalJson) {
  let totalStmts = 0;
  let coveredStmts = 0;
  let totalFuncs = 0;
  let coveredFuncs = 0;
  let totalBranches = 0;
  let coveredBranches = 0;

  const result = {};

  for (const [filePath, fileData] of Object.entries(finalJson)) {
    const fileMetrics = extractFileFinalMetrics(fileData);
    result[filePath] = fileMetrics;

    totalStmts += fileMetrics.statements.total;
    coveredStmts += fileMetrics.statements.covered;
    totalFuncs += fileMetrics.functions.total;
    coveredFuncs += fileMetrics.functions.covered;
    totalBranches += fileMetrics.branches.total;
    coveredBranches += fileMetrics.branches.covered;
  }

  result.total = {
    lines: { pct: totalStmts ? (coveredStmts / totalStmts) * 100 : 100 },
    statements: { pct: totalStmts ? (coveredStmts / totalStmts) * 100 : 100 },
    branches: { pct: totalBranches ? (coveredBranches / totalBranches) * 100 : 100 },
    functions: { pct: totalFuncs ? (coveredFuncs / totalFuncs) * 100 : 100 }
  };

  return result;
}

/**
 * Computes module-level coverage breakdown from per-file summary records.
 *
 * @param {Record<string, any>} summaryData Raw coverage summary data.
 * @returns {import('../types.js').ModuleCoverageBreakdown[]}
 */
function computeModuleBreakdown(summaryData) {
  /** @type {import('../types.js').ModuleCoverageBreakdown[]} */
  const breakdown = [];

  for (const mod of FRONTEND_MODULES) {
    let modLinesTot = 0;
    let modLinesCov = 0;
    let modStmtsTot = 0;
    let modStmtsCov = 0;
    let modFuncsTot = 0;
    let modFuncsCov = 0;
    let modBranchesTot = 0;
    let modBranchesCov = 0;
    let hasFiles = false;

    for (const [filePath, fileMetrics] of Object.entries(summaryData)) {
      if (filePath === 'total' || !fileMetrics) continue;
      const normalizedPath = filePath.replace(/\\/g, '/');

      if (!normalizedPath.includes(mod.prefix)) continue;

      hasFiles = true;
      if (fileMetrics.lines) {
        modLinesTot += fileMetrics.lines.total || 0;
        modLinesCov += fileMetrics.lines.covered || 0;
      }
      if (fileMetrics.statements) {
        modStmtsTot += fileMetrics.statements.total || 0;
        modStmtsCov += fileMetrics.statements.covered || 0;
      }
      if (fileMetrics.functions) {
        modFuncsTot += fileMetrics.functions.total || 0;
        modFuncsCov += fileMetrics.functions.covered || 0;
      }
      if (fileMetrics.branches) {
        modBranchesTot += fileMetrics.branches.total || 0;
        modBranchesCov += fileMetrics.branches.covered || 0;
      }
    }

    if (hasFiles && modLinesTot > 0) {
      breakdown.push({
        name: mod.name,
        lines: (modLinesCov / modLinesTot) * 100,
        statements: modStmtsTot ? (modStmtsCov / modStmtsTot) * 100 : 100,
        branches: modBranchesTot ? (modBranchesCov / modBranchesTot) * 100 : 100,
        functions: modFuncsTot ? (modFuncsCov / modFuncsTot) * 100 : 100
      });
    }
  }

  return breakdown;
}

/**
 * Discovers and parses coverage summaries for unit and integration suites.
 *
 * @returns {{ unitSummary: import('../types.js').CoverageSummary | null, integrationSummary: import('../types.js').CoverageSummary | null }}
 */
function findTierSummaries() {
  let unitSummary = null;
  let integrationSummary = null;

  const candidateDirs = ['coverage-reports', 'coverage'];
  for (const dir of candidateDirs) {
    const files = findFilesRecursive(dir, /coverage-summary\.json$/);
    for (const f of files) {
      const norm = f.replace(/\\/g, '/').toLowerCase();
      const raw = safeReadJson(f);
      if (!raw?.total) continue;

      if (norm.includes('unit') && !unitSummary) {
        unitSummary = raw.total;
      } else if (norm.includes('integration') && !integrationSummary) {
        integrationSummary = raw.total;
      }
    }
  }

  return { unitSummary, integrationSummary };
}

/**
 * Parses and computes the complete frontend coverage report.
 *
 * @param {string[]} [candidateFiles=DEFAULT_CANDIDATE_SUMMARY_FILES] Candidate summary report file paths.
 * @param {string} [fallbackCoverageFinalPath='coverage-merged/coverage-final.json'] Fallback nyc JSON file path.
 * @returns {import('../types.js').LayerCoverageReport | null} Parsed frontend coverage report, or null if not found.
 */
export function parseFrontendCoverage(
  candidateFiles = DEFAULT_CANDIDATE_SUMMARY_FILES,
  fallbackCoverageFinalPath = 'coverage-merged/coverage-final.json'
) {
  let summaryData = null;

  for (const file of candidateFiles) {
    const raw = safeReadJson(file);
    if (raw && raw.total) {
      summaryData = raw;
      break;
    }
  }

  if (!summaryData && fs.existsSync(fallbackCoverageFinalPath)) {
    const finalJson = safeReadJson(fallbackCoverageFinalPath);
    if (finalJson) {
      summaryData = aggregateFromCoverageFinal(finalJson);
    }
  }

  if (!summaryData || !summaryData.total) {
    return null;
  }

  const breakdown = computeModuleBreakdown(summaryData);
  const { unitSummary, integrationSummary } = findTierSummaries();

  return {
    total: summaryData.total,
    all: summaryData.total,
    unit: unitSummary || undefined,
    integration: integrationSummary || undefined,
    breakdown
  };
}
