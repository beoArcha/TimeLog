import path from 'node:path';
import { findFilesRecursive, safeReadJson } from '../fs-utils.js';

/**
 * Extracts test failures and execution duration from parsed test result payload.
 *
 * @param {Record<string, any>} data Raw JSON payload.
 * @returns {{ durationMs: number, failures: import('../types.js').TestFailure[] }}
 */
function extractFailuresAndDuration(data) {
  let durationMs = 0;
  /** @type {import('../types.js').TestFailure[]} */
  const failures = [];

  if (!data.startTime || !Array.isArray(data.testResults)) {
    return { durationMs, failures };
  }

  for (const tr of data.testResults) {
    if (tr.endTime && tr.startTime) {
      durationMs += tr.endTime - tr.startTime;
    }

    if (!Array.isArray(tr.assertionResults)) continue;

    for (const ar of tr.assertionResults) {
      if (!ar || ar.status !== 'failed') continue;

      const trName = tr.name || 'tests';
      const relativePath = path.relative(process.cwd(), String(trName)).replace(/\\/g, '/');
      failures.push({
        file: relativePath,
        title: ar.fullName || ar.title || 'Unknown test failure',
        message: Array.isArray(ar.failureMessages) ? ar.failureMessages.join('\n') : ''
      });
    }
  }

  return { durationMs, failures };
}

/**
 * Merges two suite summaries into a combined total.
 *
 * @param {import('../types.js').SuiteTestSummary} a
 * @param {import('../types.js').SuiteTestSummary} b
 * @returns {import('../types.js').SuiteTestSummary}
 */
function combineSuiteSummaries(a, b) {
  return {
    total: a.total + b.total,
    passed: a.passed + b.passed,
    failed: a.failed + b.failed,
    skipped: a.skipped + b.skipped,
    durationMs: (a.durationMs || 0) + (b.durationMs || 0)
  };
}

/**
 * Classifies a test artifact filepath into its corresponding runtime and tier.
 *
 * @param {string} filePath File path string.
 * @returns {'rust-unit' | 'rust-integration' | 'unit' | 'integration' | 'other'}
 */
function classifyTestFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  if (normalized.includes('rust-unit')) return 'rust-unit';
  if (normalized.includes('rust-integration')) return 'rust-integration';
  if (normalized.includes('unit')) return 'unit';
  if (normalized.includes('integration')) return 'integration';
  return 'other';
}

/**
 * Aggregates all JSON test results matching `test-results*.json` across candidate search paths.
 *
 * @param {string[]} [searchDirs=['coverage-reports', 'coverage', '.']] Directories to inspect for test artifacts.
 * @returns {import('../types.js').TestExecutionSummary} Aggregated test run summary with multi-tier breakdowns.
 */
export function parseTestResults(searchDirs = ['coverage-reports', 'coverage', '.']) {
  let testFiles = [];

  for (const dir of searchDirs) {
    const found = findFilesRecursive(dir, /^test-results.*\.json$/);
    testFiles.push(...found);
  }
  testFiles = [...new Set(testFiles)];

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  let totalDurationMs = 0;
  /** @type {import('../types.js').TestFailure[]} */
  const allFailures = [];

  /** @type {Record<string, import('../types.js').SuiteTestSummary>} */
  const classifiedSuites = {};

  for (const file of testFiles) {
    /** @type {any} */
    const data = safeReadJson(file);
    if (!data) continue;

    const total = data.numTotalTests || 0;
    const passed = data.numPassedTests || 0;
    const failed = data.numFailedTests || 0;
    const skipped = (data.numPendingTests || 0) + (data.numTodoTests || 0);
    const { durationMs, failures } = extractFailuresAndDuration(data);

    totalTests += total;
    passedTests += passed;
    failedTests += failed;
    skippedTests += skipped;
    totalDurationMs += durationMs;
    allFailures.push(...failures);

    const classification = classifyTestFile(file);
    const currentSummary = { total, passed, failed, skipped, durationMs };

    if (classifiedSuites[classification]) {
      classifiedSuites[classification] = combineSuiteSummaries(classifiedSuites[classification], currentSummary);
    } else {
      classifiedSuites[classification] = currentSummary;
    }
  }

  /** @type {import('../types.js').TestExecutionSummary} */
  const result = {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    skipped: skippedTests,
    durationMs: totalDurationMs,
    failures: allFailures
  };

  const hasFrontend = classifiedSuites.unit || classifiedSuites.integration;
  if (hasFrontend) {
    const zero = { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 };
    const u = classifiedSuites.unit || zero;
    const i = classifiedSuites.integration || zero;
    result.frontend = {
      unit: classifiedSuites.unit,
      integration: classifiedSuites.integration,
      all: combineSuiteSummaries(u, i)
    };
  }

  const hasBackend = classifiedSuites['rust-unit'] || classifiedSuites['rust-integration'];
  if (hasBackend) {
    const zero = { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 };
    const ru = classifiedSuites['rust-unit'] || zero;
    const ri = classifiedSuites['rust-integration'] || zero;
    result.backend = {
      unit: classifiedSuites['rust-unit'],
      integration: classifiedSuites['rust-integration'],
      all: combineSuiteSummaries(ru, ri)
    };
  }

  return result;
}
